import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext({});

// Update baseURL to match the backend server
const client = axios.create({
    baseURL: `http://localhost:3000/api/v1/users` // Change to match your backend API base URL
});

export const AuthProvider = ({ children }) => {
    const authContext = useContext(AuthContext);
    const [userData, setUserData] = useState(authContext);
    const router = useNavigate();

    const handleRegister = async (name, username, password) => {
        try {
            const request = await client.post("/register", {
                name,
                username,
                password
            });

            if (request.status === httpStatus.CREATED) {
                return request.data.message;
            }
        } catch (err) {
            console.error('Error during registration:', err);
            let message = 'An error occurred';
            if (err.response) {
                message = err.response.data?.message || 'Server error';
            } else if (err.request) {
                message = 'No response from server';
            } else {
                message = err.message || 'Unknown error';
            }
            throw new Error(message);
        }
    };

    const handleLogin = async (username, password) => {
        try {
            const request = await client.post("/login", {
                username,
                password
            });

            if (request.status === httpStatus.OK) {
                localStorage.setItem("token", request.data.token);
                router("/home");
            }
        } catch (err) {
            console.error('Error during login:', err);
            let message = 'An error occurred';
            if (err.response) {
                message = err.response.data?.message || 'Server error';
            } else if (err.request) {
                message = 'No response from server';
            } else {
                message = err.message || 'Unknown error';
            }
            throw new Error(message);
        }
    };

    const getHistoryOfUser = async () => {
        try {
            const request = await client.get("/get_all_activity", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            return request.data;
        } catch (err) {
            console.error('Error fetching user history:', err);
            let message = 'An error occurred';
            if (err.response) {
                message = err.response.data?.message || 'Server error';
            } else if (err.request) {
                message = 'No response from server';
            } else {
                message = err.message || 'Unknown error';
            }
            throw new Error(message);
        }
    };

    const addToUserHistory = async (meetingCode) => {
        try {
            const request = await client.post("/add_to_activity", {
                meeting_code: meetingCode
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            return request;
        } catch (err) {
            console.error('Error adding to user history:', err);
            let message = 'An error occurred';
            if (err.response) {
                message = err.response.data?.message || 'Server error';
            } else if (err.request) {
                message = 'No response from server';
            } else {
                message = err.message || 'Unknown error';
            }
            throw new Error(message);
        }
    };

    const data = {
        userData, setUserData, addToUserHistory, getHistoryOfUser, handleRegister, handleLogin
    };

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    );
};
