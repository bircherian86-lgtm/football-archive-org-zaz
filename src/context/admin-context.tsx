'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AdminContextType {
    isAdmin: boolean;
    login: () => void;
    logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false);

    const login = () => setIsAdmin(true);
    const logout = () => setIsAdmin(false);

    return (
        <AdminContext.Provider value={{ isAdmin, login, logout }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
}
