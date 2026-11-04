//Include Both Helper File with needed methods
import { getFirebaseBackend } from "../../../helpers/firebase_helper";
import {
  postFakeLogin,
  postJwtLogin,
} from "../../../helpers/fakebackend_helper";

import { loginSuccess, logoutUserSuccess, apiError, reset_login_flag } from './reducer';
import { setAuthorization } from "../../../helpers/api_helper";

// const fireBaseBackend = getFirebaseBackend();

const API_BASE = process.env.REACT_APP_API_BASE;

// The login page shows `payload.data` as the error and re-enables the button a few seconds later.
const loginFailed = (message: string) => apiError({ data: message });

export const loginUser = (user: any, history: any) => async (dispatch: any) => {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user.username, password: user.password }),
    });
  } catch {
    dispatch(loginFailed("Serveur injoignable. Vérifiez votre connexion internet."));
    return;
  }

  const body = await response.json().catch(() => null);
  const data = body?.user;

  if (!response.ok || !data) {
    // The API answers 404 for an unknown username and 401 for a wrong password.
    const wrongCredentials = response.status === 401 || response.status === 404;
    dispatch(loginFailed(wrongCredentials
      ? "Nom d'utilisateur ou mot de passe incorrect."
      : "Connexion impossible. Réessayez dans un instant."));
    return;
  }

  sessionStorage.setItem("authUser", JSON.stringify(data));
  setAuthorization(data.token);
  dispatch(loginSuccess(data));
  history("/dashboard");
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