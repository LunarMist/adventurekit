import axios, { AxiosError, AxiosResponse } from 'axios';
import qs from 'qs';

export type LoginResponse = { status: boolean; message: string };

export function login(email: string, password: string): Promise<LoginResponse> {
  const formData = {
    email,
    password,
  };

  return axios.post('/login/', qs.stringify(formData))
    .then((response: AxiosResponse) => {
      return { status: true, message: response.data.message };
    })
    .catch((error: AxiosError) => {
      let message = 'An unknown error has occurred';
      if (error.response) {
        message = error.response.data.message || error.response.statusText || 'An unknown error has occurred';
      }
      return { message, status: false };
    });
}

export function register(username: string, email: string, password: string): Promise<LoginResponse> {
  const formData = {
    username,
    email,
    password,
  };

  return axios.post('/register/', qs.stringify(formData))
    .then((response: AxiosResponse) => {
      return { status: true, message: response.data.message };
    })
    .catch((error: AxiosError) => {
      let message = 'An unknown error has occurred';
      if (error.response) {
        message = error.response.data.message || error.response.statusText || 'An unknown error has occurred';
      }
      return { message, status: false };
    });
}
