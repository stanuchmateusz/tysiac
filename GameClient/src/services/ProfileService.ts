import AuthService from "./AuthService";

export type UserDto = {
    id: string;
    username: string;
    email: string;
}

class ProfileService {

    getProfile = async (account_id: string) => {
        try {
            const response = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/user/" + account_id, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AuthService.getToken()}`
                }
            });
            if (response.ok)
                return response.json();
        } catch (error) {
            console.log(error);
            return null;
        }
        return null;
    }

    changePassword = async (email: string, oldpass: string, newpass: string): Promise<boolean> => {
        try {
            const response = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/auth/change-password", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AuthService.getToken()}`
                },
                body: JSON.stringify({ email, newpassword: newpass, oldpassword: oldpass }),
            });
            return response.ok;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

}
export default new ProfileService();
