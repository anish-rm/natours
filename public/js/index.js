/* eslint-disable */
// now we have created a bundle using parcel
// and we told that to watch this index.js
// so whenever it changes it will bundle again to whole new file
// this file is to get input from user and update
import '@babel/polyfill'; //to make js work in older version as well

import { login, logout } from './login'; //{ } because we export ike that refer login.js
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';
// const 

// DOM ELEMENTS
const form  = document.querySelector('.form--login');
const logoutbtn  = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const pwdbtn = document.querySelector('.btn--green.btn--save-password');
const bookBtn = document.getElementById('book-tour');

if(form){
    form.addEventListener('submit', e=> {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email,password);
    });
}

if(logoutbtn) logoutbtn.addEventListener('click', logout);

if(userDataForm){
    userDataForm.addEventListener('submit', e=>{
        e.preventDefault();
        // programatically recreate form multi-part data
        const form = new FormData();
        // we need to change below to formdata
        // const name = document.getElementById('name').value;
        // const email = document.getElementById('email').value;

        form.append('name', document.getElementById('name').value);
        form.append('email', document.getElementById('email').value);
        // now to send photo
        form.append('photo', document.getElementById('photo').files[0]); //files are actually array and since we upload only we put 0
        console.log(form);
        // we just recreated multipart form data

        // our axios will recognize this as a form and work just fine
        updateSettings(form, 'data');
    })
}

if(userPasswordForm){
    userPasswordForm.addEventListener('submit', async e=>{
        e.preventDefault();
        // this is becoz when we update it takes some time for encryption at that time we want user to know that something is happpening

        pwdbtn.innerHTML = 'Updating...';

        const currentPassword = document.getElementById('password-current').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('password-confirm').value;
        await updateSettings({ currentPassword,password, passwordConfirm}, 'password');

        pwdbtn.innerHTML = 'Save password';
        document.getElementById('password-current').value= '';
        document.getElementById('password').value = '';
        document.getElementById('password-confirm').value = '';
    })
}
if(bookBtn){
    bookBtn.addEventListener('click', e=>{
        // {tourId} --> destruting since it is same name as dataset atribute
        e.target.textContent = 'Processing';
        const {tourId} = e.target.dataset; //e-target is the ellement that is clicked
        bookTour(tourId);
    });
}