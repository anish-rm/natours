/* eslint-disable */
import axios from 'axios';

export const bookTour = async tourId => {
    const stripe = Stripe('pk_test_51MUSzJSErNw1bi0ReYXqHw1kIymhBanYb0pwlDafRMgYZO6CTP3MRVHJ0PmiFBriwvHeVcEpNz9oRabhq2cxAld500qIOjRkde');
    // 1 get checkout session from server
    try {
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session);
 
    
    //await stripe.redirectToCheckout({
    //  sessionId: session.data.session.id,
    //});
 
    //works as expected
    window.location.replace(session.data.session.url);
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
    // 2 Create checkout form + charge credit card
};