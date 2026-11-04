USE propintel;

-- Synthetic sample records for the fictional Northstar Homes demo workspace.
-- Run this file once after schema.sql. Do not use real customer information.

INSERT INTO leads (
  name, location, property_requirement, budget_min, budget_max,
  buying_timeline, customer_message, status
) VALUES
(
  'Aarav Mehta',
  'Whitefield, Bengaluru',
  '3BHK apartment',
  9000000,
  12000000,
  'Within 2 months',
  'Looking for a 3BHK apartment in Whitefield. Budget is around INR 1.2 crore. Need good connectivity and proximity to schools.',
  'new'
),
(
  'Nisha Rao',
  'Sarjapur Road, Bengaluru',
  '2BHK apartment',
  6500000,
  8500000,
  '3 to 6 months',
  'We are exploring a 2BHK near Sarjapur Road. Would like to understand available options and maintenance costs.',
  'contacted'
),
(
  'Kabir Sharma',
  'North Bengaluru',
  'Independent villa',
  15000000,
  20000000,
  'More than 6 months',
  'Considering an independent villa in North Bengaluru. Still comparing locations and would like more information.',
  'new'
);
