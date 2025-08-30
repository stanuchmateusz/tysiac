import type { CredentialResponse } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { setCookie, userNicknameCookieName } from "../utils/Cookies";
import type { UserDto } from "./ProfileService";
import ProfileService from "./ProfileService";

type DecodedToken = {
    sub: string;          // user.Id
    unique_name: string;  // Username
    role?: string | string[]; // ASP.NET ClaimTypes.Role
    exp: number;          // expiration
};

const microsoftRoleSchema = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

class AuthService {
    private static instance: AuthService;
    private authState = false;
    private roles: string[] = [];
    private user: UserDto | null = null;

    constructor() {
        console.debug("AuthService constructor call");
        var token = this.getToken()
        if (token) {
            console.debug("Token found");
            this.authState = true;
            this.parseToken(token);

        }
    }
    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }
    private parseToken(token: string) {
        try {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            this.user = {
                id: decoded.sub,
                username: decoded.unique_name,
                email: ""
            }
            this.roles = decoded[microsoftRoleSchema] ? (Array.isArray(decoded[microsoftRoleSchema]) ? decoded[microsoftRoleSchema] : [decoded[microsoftRoleSchema]]) : [];
            this.authState = true;
            ProfileService.getProfile(this.user.id).then(profile => {
                this.user!.email = profile.email;
            }).catch(err => {
                console.error(err);
            })
            if (this.user)
                setCookie(userNicknameCookieName, this.user.username, 365);
        } catch {
            console.error("Failed to parse token");
            this.authState = false;
        }
    }

    getToken = (): string | null => {
        return localStorage.getItem("token");
    }

    getDecoded = (): DecodedToken | null => {
        const token = this.getToken();
        if (!token) return null;
        try {
            return jwtDecode<DecodedToken>(token);
        } catch {
            return null;
        }
    }

    getUsername = () => {
        return this.getDecoded()?.unique_name ?? null;
    }

    getRoles = (): string[] => {
        const r = this.getDecoded()?.role;
        if (!r) return [];
        return Array.isArray(r) ? r : [r];
    }

    isAuthenticated = () => {
        return this.authState && !!this.getToken();
    }

    isAdmin = () => {
        return this.roles.includes("Admin");
    }

    getUser() {
        return this.user;
    }

    login = async (email: string, password: string, rememberMe: boolean): Promise<boolean> => {
        try {
            const response = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/auth/login", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, rememberMe }),
            });

            if (response.status === 200) {
                const data = await response.json() as AuthResponse;
                this.storeToken(data.token);
                this.parseToken(data.token);
                this.authState = true;
                return true;
            }
            return false;

        } catch (error) {
            console.error('Failed to login:', error);
            throw error;
        }
    }

    logout() {
        localStorage.removeItem("token");
        console.debug("Token removed");
        this.authState = false;
        this.roles = [];
        this.user = null;
    }

    register = async (email: string, username: string, password: string) => {
        try {
            const response = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/auth/register",
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, username, password }),
                }
            );

            if (response.status === 200) {
                const data = await response.json() as AuthResponse;
                this.storeToken(data.token);
                this.parseToken(data.token);
                this.authState = true;
                return true;
            }
            return false;

        } catch (error) {
            console.error('Failed to register:', error);
            throw error;
        }
    }

    loginGoogle = async (googleResponse: CredentialResponse) => {
        try {
            const response = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/auth/google",
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        IdToken: googleResponse.credential
                    }),
                }
            );
            if (!response.ok || response.body === null) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json() as AuthResponse;
            this.storeToken(data.token);
            this.parseToken(data.token);
            this.authState = true;
            return response.status === 200;

        } catch (error) {
            console.error('Failed to login with Google:', error);
            throw error;
        }
    }

    private storeToken = (token: string) => {
        localStorage.setItem('token', token);
    }

    checkAuth = async (): Promise<boolean> => {

        try {
            const response = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/auth/",
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                }
            );
            this.authState = response.status === 200;

        } catch (error) {
            console.debug('Failed to confirm auth:', error);
            this.authState = false;
        }
        return this.authState;
    }
};

type AuthResponse = {
    token: string;
}
export default AuthService.getInstance();