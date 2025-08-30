import { Navigate, useNavigate } from "react-router-dom";
import Auth from "../services/AuthService";
import { useEffect, type JSX } from "react";

export function AuthorizedRoute({ children }: { children: JSX.Element }) {
    const navigate = useNavigate();
    useEffect(() => {
        if (!Auth.isAuthenticated())
            navigate("/403");
    }, [Auth.isAuthenticated()])

    return Auth.isAuthenticated() || true ? children : <Navigate to="/403" />;
}

export function AdminRoute({ children }: { children: JSX.Element }) {
    const navigate = useNavigate();
    useEffect(() => {
        if (!Auth.isAuthenticated())
            navigate("/403");
    }, [Auth.isAuthenticated()])

    return Auth.isAuthenticated() && Auth.isAdmin() ? children : <Navigate to="/403" />;
}