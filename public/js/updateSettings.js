/* eslint-disable */
// updateData
import axios from 'axios';
import { showAlert } from "./alerts";

// export const updateData = async (name, email) => {
//     try {
//         const res = await axios({
//             method: 'PATCH',
//             url: 'http://localhost:8000/api/v1/users/updateMe',
//             data: {
//                 name,
//                 email
//             }
//         });
//         if(res.data.status === 'success') {
//             showAlert('success', 'Data updated successfully!');
//         }
//     } catch (err) {
//         showAlert('error', err.response.data.message);
//     }
// }

// this is same for both data and pwd so we can make them single function
// here data will be object and type - 'password' or 'data'
export const updateSettings = async (data, type) => {
    try {
        const url = type === 'password' ? 'http://localhost:8000/api/v1/users/updateMyPassword' : 'http://localhost:8000/api/v1/users/updateMe'
        const res = await axios({
            method: 'PATCH',
            url,
            data
        });
        if(res.data.status === 'success') {
            showAlert('success', `${type.toUpperCase()} updated successfully!`);
        }
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
}