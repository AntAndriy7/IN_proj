import React from "react";
import {Route, Routes, Navigate, useLocation} from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { AnimatePresence, motion } from "framer-motion";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import SignUpAviaForm from "./SignUpAviaForm";
import Main from "./client/Main";
import Cabinet from "./client/Cabinet";
import AviaMain from "./avia/AviaMain";
import AviaCabinet from "./avia/AviaCabinet";
import AdminMain from "./admin/AdminMain";

function App() {
    const location = useLocation();

    const useAuth = (requiredRole) => {
        const token = localStorage.getItem('jwtToken');
        if (!token) return false;
        const decodedToken = jwtDecode(token);
        let isAuthenticated = false;
        if (decodedToken.role === requiredRole || (decodedToken.role === "AVIA-temp" && requiredRole === "AVIA")) {
            isAuthenticated = true;
        }
        return isAuthenticated;
    };

    const ProtectedRoute = ({ children, role }) => {
        const hasPermission = useAuth(role);
        if (!hasPermission) {
            return <Navigate to="/login" replace />;
        }
        return children;
    };

    function NavigateBasedOnRole() {
        const token = localStorage.getItem('jwtToken');
        if (!token) return <Navigate to="/main" replace />;

        try {
            const decodedToken = jwtDecode(token);
            switch (decodedToken.role) {
                case "ADMIN":
                    return <Navigate to="/admin/main" replace />;
                case "AVIA":
                case "AVIA-temp":
                    return <Navigate to="/avia/main" replace />;
                default:
                    return <Navigate to="/main" replace />;
            }
        } catch (e) {
            console.error("Invalid token", e);
            return <Navigate to="/login" replace />;
        }
    }

    const PageWrapper = ({ children }) => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ height: "100%" }}
        >
            {children}
        </motion.div>
    );

  return (
      <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
              <Route
                  path="/"
                  element={<NavigateBasedOnRole />}
              />
              <Route
                  path="/signup"
                  element={<PageWrapper><SignUpForm /></PageWrapper>}
              />
              <Route
                  path="/signupavia"
                  element={<PageWrapper><SignUpAviaForm /></PageWrapper>}
              />
              <Route
                  path="/login"
                  element={<PageWrapper><LoginForm /></PageWrapper>}
              />
              <Route
                  path="/main"
                  element={<PageWrapper><Main /></PageWrapper>}
              />
              <Route
                  path="/cabinet"
                  element={<ProtectedRoute role="CLIENT"><PageWrapper><Cabinet /></PageWrapper></ProtectedRoute>}
              />
              <Route
                  path="/avia/main"
                  element={<ProtectedRoute role="AVIA"><PageWrapper><AviaMain /></PageWrapper></ProtectedRoute>}
              />
              <Route
                  path="/avia/cabinet"
                  element={<ProtectedRoute role="AVIA"><PageWrapper><AviaCabinet /></PageWrapper></ProtectedRoute>}
              />
              <Route
                  path="/admin/main"
                  element={<ProtectedRoute role="ADMIN"><PageWrapper><AdminMain /></PageWrapper></ProtectedRoute>}
              />
          </Routes>
      </AnimatePresence>
  );
}

export default App;
