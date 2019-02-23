import Axios, {AxiosError, AxiosResponse} from "axios";
import qs from "qs";

export type LoginResponse = { status: boolean; message: string };

export function login(email: string, password: string): Promise<LoginResponse> {
  const formData = {
    email: email,
    password: password,
  };

  return Axios.post('/login/', qs.stringify(formData))
    .then((response: AxiosResponse) => {
      return {status: true, message: response.data.message};
    })
    .catch((error: AxiosError) => {
      let message = "An unknown error has occurred";
      if (error.response) {
        message = error.response.data.message || error.response.statusText || "An unknown error has occurred";
      }
      return {status: false, message: message};
    });
}

export function register(username: string, email: string, password: string): Promise<LoginResponse> {
  const formData = {
    username: username,
    email: email,
    password: password,
  };

  return Axios.post('/register/', qs.stringify(formData))
    .then((response: AxiosResponse) => {
      return {status: true, message: response.data.message};
    })
    .catch((error: AxiosError) => {
      let message = "An unknown error has occurred";
      if (error.response) {
        message = error.response.data.message || error.response.statusText || "An unknown error has occurred";
      }
      return {status: false, message: message};
    });
}
