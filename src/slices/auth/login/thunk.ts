//Include Both Helper File with needed methods
import { getFirebaseBackend } from "../../../helpers/firebase_helper";
import {
  postFakeLogin,
  postJwtLogin,
} from "../../../helpers/fakebackend_helper";

import { loginSuccess, logoutUserSuccess, apiError, reset_login_flag } from './reducer';

// const fireBaseBackend = getFirebaseBackend();

import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE;

export const loginUser = (user: any, history: any) => async (dispatch: any) => {
  try {
debugger
    const response : any = await axios.post(`${API_BASE}/auth/login`, {
      username: user.username,
      password: user.password,
    });

    const data = response.user;

    if (data) {
      // Save user data in sessionStorage
      sessionStorage.setItem("authUser", JSON.stringify(data));

      // Dispatch login success
      dispatch(loginSuccess(data));

      // Redirect to dashboard
      history("/dashboard");
    } 
  } catch (error: any) {
    dispatch(apiError(error.response?.data || { message: error.message }));
  }
};


export const logoutUser = () => async (dispatch : any) => {
  try {
    sessionStorage.removeItem("authUser");
    let fireBaseBackend : any= getFirebaseBackend();
    if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
      const response = fireBaseBackend.logout;
      dispatch(logoutUserSuccess(response));
    } else {
      dispatch(logoutUserSuccess(true));
    }

  } catch (error : any) {
    dispatch(apiError(error));
  }
};

export const socialLogin = (type : any, history : any) => async (dispatch : any) => {
  try {
    let response;

    if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
      const fireBaseBackend : any = getFirebaseBackend();
      response = fireBaseBackend.socialLoginUser(type);
    }
    //  else {
      //   response = postSocialLogin(data);
      // }
      
      const socialdata = await response;
    if (socialdata) {
      sessionStorage.setItem("authUser", JSON.stringify(response));
      dispatch(loginSuccess(response));
      history('/dashboard')
    }

  } catch (error : any) {
    dispatch(apiError(error));
  }
};

export const resetLoginFlag = () => async (dispatch : any) => {
  try {
    const response = dispatch(reset_login_flag());
    return response;
  } catch (error : any ){
    dispatch(apiError(error));
  }
};