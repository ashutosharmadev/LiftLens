# User data that must survive anything done to the app stack:
# the measurement table and the user accounts whose IDs key it.
# Its own root (so `terraform destroy` on the app can't reach it), plus
# AWS-level deletion protection on both. See docs/adr/006-protected-data-stack.md.
