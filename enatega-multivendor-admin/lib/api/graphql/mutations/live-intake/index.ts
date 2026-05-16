import { gql } from "@apollo/client";

// Lieferando-style accept: set status ACCEPTED + an ETA (preparationTime, min).
// Backend: updateStatus(id, orderStatus, preparationTime) — Husseinahk/orda#157.
export const ACCEPT_ORDER_WITH_TIME = gql`
  mutation AcceptOrderWithTime(
    $id: String!
    $orderStatus: String!
    $preparationTime: Int
  ) {
    updateStatus(
      id: $id
      orderStatus: $orderStatus
      preparationTime: $preparationTime
    ) {
      _id
      orderStatus
    }
  }
`;

// Live-Monitor — advance a running order one step (no ETA change).
// Reuses the same backend updateStatus op (Husseinahk/orda#157).
export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatusBoard($id: String!, $orderStatus: String!) {
    updateStatus(id: $id, orderStatus: $orderStatus) {
      _id
      orderStatus
    }
  }
`;

// Live-Monitor — assign one of the restaurant's own drivers to an order.
// Backend assignRider(id, riderId) (Husseinahk/orda#181).
export const ASSIGN_ORDER_RIDER = gql`
  mutation AssignOrderRider($id: String!, $riderId: String!) {
    assignRider(id: $id, riderId: $riderId) {
      _id
      rider {
        _id
        name
      }
    }
  }
`;
