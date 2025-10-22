import React from "react";
import Footer from "./Footer.js";
import '../styles/Main.css';

function Layout({ children }) {
    return (
        <div className="page-wrapper">
            <div className="main-content-wrapper">
                {children}
            </div>
            <Footer />
        </div>
    );
}

export default Layout;
