import React from "react";
import '../styles/Main.css';
import logoFacebook from "../resources/facebook-col.png";
import logoInstagram from "../resources/instagram-col.png";

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-column">
                    <h3>CALL CENTER 9:00 - 22:00</h3>
                    <p>free calls within Ukraine:</p>
                    <p className="phone">0 800 500 556</p>
                    <p>Find us on social networks</p>
                    <div className="social-icons">
                        <a href="#" target="_blank" rel="noopener noreferrer">
                            <img src={logoFacebook} alt="Facebook" className="social-icon-img" />
                        </a>
                        <a href="#" target="_blank" rel="noopener noreferrer">
                            <img src={logoInstagram} alt="Instagram" className="social-icon-img" />
                        </a>
                    </div>
                </div>

                <div className="footer-right">
                    <div className="footer-column">
                        <h3>About us</h3>
                        <ul>
                            <li><a href="#">Contacts</a></li>
                            <li><a href="#">About KIA</a></li>
                            <li><a href="#">Partners</a></li>
                            <li><a href="#">Vacancies</a></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h3>Passengers</h3>
                        <ul>
                            <li><a href="#">Baggage Rules</a></li>
                            <li><a href="#">Security Control</a></li>
                            <li><a href="#">Accessibility</a></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h3>Help</h3>
                        <ul>
                            <li><a href="#">Frequently Asked Questions</a></li>
                            <li><a href="#">All Services</a></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <span>© 2025 Kyiv International Airport</span>
                <span>All rights reserved</span>
            </div>
        </footer>
    );
}

export default Footer;