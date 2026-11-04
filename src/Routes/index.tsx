import React from 'react';
import { Routes, Route, useLocation } from "react-router-dom";

//Layouts
import NonAuthLayout from "../Layouts/NonAuthLayout";
import VerticalLayout from "../Layouts/index";

//routes
import { authProtectedRoutes, publicRoutes } from "./allRoutes";
import  AuthProtected  from './AuthProtected';
import ErrorBoundary from "../Components/Common/ErrorBoundary";

const Index = () => {
    const { pathname } = useLocation();
    return (
        <React.Fragment>
            <Routes>
                <Route>
                    {publicRoutes.map((route: { path: string | undefined; component: any; }, idx: React.Key | null | undefined) => (
                        <Route
                            path={route.path}
                            element={
                                <NonAuthLayout>
                                    {route.component}
                                </NonAuthLayout>
                            }
                            key={idx}
                            // exact={true}
                        />
                    ))}
                </Route>

                <Route>
                    {authProtectedRoutes.map((route, idx) => (
                        <Route
                            path={route.path}
                            element={
                                <AuthProtected>
                                    <VerticalLayout>
                                        {/* A crash in one page shows an error card; the menu keeps working.
                                            The key resets it when the user opens another page. */}
                                        <ErrorBoundary key={pathname}>{route.component}</ErrorBoundary>
                                    </VerticalLayout>
                                </AuthProtected>}
                            key={idx}
                            // exact={true}
                        />
                    ))}
                </Route>
            </Routes>
        </React.Fragment>
    );
};

export default Index;