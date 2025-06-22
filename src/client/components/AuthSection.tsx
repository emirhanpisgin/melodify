import { useEffect, useState } from "react";

type UserInfo = { display_name?: string; email?: string };

type Props = {
    kick: {
        authenticated: boolean;
        onLogin: () => void;
        onLogout: () => void;
    };
};

export default function AuthSection() {

    return (
        <div className="max-w-4xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-12">


            
        </div>
    );
}
