/* eslint-disable */
import axios from "axios";
import { showAlert } from "./alerts";

export const login = async (email, password) => {
    // inorder to do https request we are going to use axios
    try {
        console.log('hello iam from form');
        const res = await axios({
            method: 'POST',
            url: 'http://localhost:8000/api/v1/users/login',
            data: {
                email,
                password
            }
        });

        if(res.data.status === 'success') {
            showAlert('success', 'Logged in succesfully!');
            // to load to home page after logged in
            window.setTimeout(() => {
                location.assign("/");
            }, 1500);
        }
        // console.log(res);
    } catch(err){
        showAlert('error', err.response.data.message);
    }
};

export const logout = async () => {
    try{
        const res = await axios({
            method: 'GET',
            url:'http://localhost:8000/api/v1/users/logout'
        });
        // we need to reload the page so it will send invalid cookie to server and then we will be logged out

        if(res.data.status == 'success'){
            location.reload(true); //it will force reload from server
        }

    } catch(err) {
        console.log(err.response);
        showAlert('error', 'Error logging out! Try Again.')
    }
}
