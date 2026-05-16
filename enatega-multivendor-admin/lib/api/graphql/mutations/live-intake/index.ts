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
