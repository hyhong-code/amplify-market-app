import React from "react";
import { API, graphqlOperation } from "aws-amplify";
import StripeCheckout from "react-stripe-checkout";

import { getUser } from "../graphql/queries";
import { createorder } from "../graphql/mutations";

const stripeConfig = {
  currency: "USD",
  publishableAPIkey:
    "pk_test_51GrTMTF1X5EtJ3fQdcVa5WSPywJ3BOrQRKWMgC4J0LJtLJD4ySEFiXMiLkFbHr05srC2nxizdNMwJpYdBaLAijgM00mrzHZtOK",
};

const PayButton = ({ product, user }) => {
  const getOwnerEmail = async () => {
    try {
      const res = await API.graphql(
        graphqlOperation(getUser, { id: product.owner })
      );
      return res.data.getUser.email;
    } catch (error) {
      console.error(error);
    }
  };

  const handleToken = async (token) => {
    try {
      const result = await API.post("orderlambda", "/charge", {
        body: {
          token,
          charge: {
            currency: stripeConfig.currency,
            amount: product.price,
            descripiton: product.descripiton,
          },
          email: {
            customerEmail: user.attributes.email,
            ownerEmail: await getOwnerEmail(),
            shipped: product.shipped,
          },
        },
      });

      if (result.charge.status === "succeeded") {
        const input = {
          orderProductId: product.id,
          orderUserId: user.attributes.sub,
        };

        if (product.shipped) {
          input.shippingAddress = {
            address_line1: result.chargesource.address_line1,
            city: result.chargesource.city,
            country: result.chargesource.country,
            address_state: result.chargesource.address_state,
            address_zip: result.chargesource.address_zip,
          };
        }

        const res = await API.graphql(graphqlOperation(createorder, { input }));
        console.log("order", res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <StripeCheckout
      token={handleToken}
      email={user.attributes.email}
      name={product.description}
      amount={product.price}
      shippingAddress={product.shipped}
      billingAddress={product.shipped}
      currency={stripeConfig.currency}
      stripeKey={stripeConfig.publishableAPIkey}
      locale="auto"
    />
  );
};

export default PayButton;
