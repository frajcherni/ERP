import React, { useEffect, useState } from 'react';
import { Card, CardBody, Col, Container, Input, InputGroup, InputGroupText, Label, Row, Button, Form, FormFeedback, Alert, Spinner } from 'reactstrap';
import ParticlesAuth from "../AuthenticationInner/ParticlesAuth";

//redux
import { useSelector, useDispatch } from "react-redux";

import { Link } from "react-router-dom";
import withRouter from "../../Components/Common/withRouter";

// Formik validation
import * as Yup from "yup";
import { useFormik } from "formik";

// actions
import { loginUser, socialLogin, resetLoginFlag } from "../../slices/thunks";

import companyLogo from "../../assets/images/imglogo.png";
import { createSelector } from 'reselect';
//import images

const Login = (props: any) => {
    const dispatch: any = useDispatch();

    const selectLayoutState = (state: any) => state;
    const loginpageData = createSelector(
        selectLayoutState,
        (state) => ({
            user: state.Account.user,
            error: state.Login.error,
            errorMsg: state.Login.errorMsg,
        })
    );
    // Inside your component
    const {
        user, error, errorMsg
    } = useSelector(loginpageData);

    const [userLogin, setUserLogin] = useState<any>([]);
    const [passwordShow, setPasswordShow] = useState<boolean>(false);
    const [loader, setLoader] = useState<boolean>(false);

    useEffect(() => {
        if (user && user) {
            const updatedUserData = process.env.REACT_APP_DEFAULTAUTH === "firebase" ? user.multiFactor.user.email : user.email;
            const updatedUserPassword = process.env.REACT_APP_DEFAULTAUTH === "firebase" ? "" : user.confirm_password;
            setUserLogin({
                email: updatedUserData,
                password: updatedUserPassword
            });
        }
    }, [user]);

    const validation: any = useFormik({
        enableReinitialize: true,
        initialValues: {
            username: userLogin.username || "" || '',
            password: userLogin.password || "" || '',
        },
        validationSchema: Yup.object({
            username: Yup.string().required("Please Enter Your Username"),
            password: Yup.string().required("Please Enter Your Password"),
        }),
        onSubmit: (values) => {
            dispatch(loginUser(values, props.router.navigate)); // use your API login
            setLoader(true);
        }
    });
    

    const signIn = (type: any) => {
        dispatch(socialLogin(type, props.router.navigate));
    };

    //handleTwitterLoginResponse
    // const twitterResponse = e => {}

    //for facebook and google authentication
    const socialResponse = (type: any) => {
        signIn(type);
    };


    useEffect(() => {
        if (errorMsg) {
            setTimeout(() => {
                dispatch(resetLoginFlag());
                setLoader(false)
            }, 3000);
        }
    }, [dispatch, errorMsg]);

    document.title = "Basic SignIn | Royal Lumiere";
    return (
        <React.Fragment>
            <ParticlesAuth>
                <div className="auth-page-content mt-lg-5">
                    <Container>
                        <Row>
                            <Col lg={12}>
                                <div className="text-center mt-sm-5 mb-4">
                                    <div>
                                        <Link to="/" className="d-inline-block auth-logo">
                                            <div className="rounded-4 shadow-lg d-inline-flex align-items-center justify-content-center p-3 px-4">
                                                <img src={companyLogo} alt="Royal Lumiere" height="90" />
                                            </div>
                                        </Link>
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        <Row className="justify-content-center">
                            <Col md={8} lg={6} xl={5}>
                                <Card className="mt-4 border-0 rounded-4 shadow-lg overflow-hidden">
                                    <div style={{ height: 6, background: "linear-gradient(to right, var(--vz-primary), var(--vz-success))" }}></div>
                                    <CardBody className="p-4 p-sm-5">
                                        <div className="text-center mb-4">
                                            <h4 className="text-primary fw-semibold">Bienvenue</h4>
                                            <p className="text-muted mb-0">Connectez-vous pour accéder à votre espace Royal Lumiere</p>
                                        </div>
                                        {error && error ? (<Alert color="danger" className="text-center"> {error} </Alert>) : null}
                                        <div className="mt-4">
                                            <Form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    validation.handleSubmit();
                                                    return false;
                                                }}
                                                action="#">

                                                <div className="mb-3">
                                                    <Label htmlFor="username" className="form-label">Nom d'utilisateur</Label>
                                                    <InputGroup>
                                                        <InputGroupText className="bg-light border-end-0"><i className="ri-user-3-line text-muted"></i></InputGroupText>
                                                        <Input
                                                            name="username"
                                                            className="form-control border-start-0"
                                                            placeholder="Entrez votre nom d'utilisateur"
                                                            onChange={validation.handleChange}
                                                            onBlur={validation.handleBlur}
                                                            value={validation.values.username || ""}
                                                        />
                                                    </InputGroup>
                                                </div>

                                                <div className="mb-3">
                                                    <div className="float-end">
                                                        <Link to="/forgot-password" className="text-muted">Mot de passe oublié ?</Link>
                                                    </div>
                                                    <Label className="form-label" htmlFor="password-input">Mot de passe</Label>
                                                    <InputGroup className="auth-pass-inputgroup">
                                                        <InputGroupText className="bg-light border-end-0"><i className="ri-lock-2-line text-muted"></i></InputGroupText>
                                                        <Input
                                                            name="password"
                                                            value={validation.values.password || ""}
                                                            type={passwordShow ? "text" : "password"}
                                                            className="form-control border-start-0 border-end-0"
                                                            placeholder="Entrez votre mot de passe"
                                                            onChange={validation.handleChange}
                                                            onBlur={validation.handleBlur}
                                                            invalid={
                                                                validation.touched.password && validation.errors.password ? true : false
                                                            }
                                                        />
                                                        <InputGroupText className="bg-light border-start-0" style={{ cursor: "pointer" }} onClick={() => setPasswordShow(!passwordShow)}>
                                                            <i className={`${passwordShow ? "ri-eye-off-line" : "ri-eye-line"} text-muted`}></i>
                                                        </InputGroupText>
                                                        {validation.touched.password && validation.errors.password ? (
                                                            <FormFeedback type="invalid">{validation.errors.password}</FormFeedback>
                                                        ) : null}
                                                    </InputGroup>
                                                </div>

                                                <div className="form-check mb-3">
                                                    <Input className="form-check-input" type="checkbox" value="" id="auth-remember-check" />
                                                    <Label className="form-check-label" htmlFor="auth-remember-check">Se souvenir de moi</Label>
                                                </div>

                                                <div className="mt-4">
                                                    <Button color="primary"
                                                        disabled={loader && true}
                                                        className="w-100 rounded-pill shadow-sm py-2 fw-semibold" type="submit">
                                                        {loader && <Spinner size="sm" className='me-2'> Loading... </Spinner>}
                                                        Se connecter
                                                    </Button>
                                                </div>

                                            </Form>
                                        </div>
                                    </CardBody>
                                </Card>

                            </Col>
                        </Row>
                    </Container>
                </div>
            </ParticlesAuth>
        </React.Fragment>
    );
};

export default withRouter(Login);