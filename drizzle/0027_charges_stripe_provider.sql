-- Allow the charges ledger to record Stripe checkouts and renewals.
ALTER TABLE `charges`
  MODIFY `provider` ENUM('fastpay','gpay','apay','mit','stripe') NOT NULL;
