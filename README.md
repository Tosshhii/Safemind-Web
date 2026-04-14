# Safemind-Web

## EmailJS Setup (Consultation + Decline)

Confirmation emails are sent from `script.js` using EmailJS.

1. Create an EmailJS account and set up:
	- One Email Service
	- One template for confirmation emails
	- One template for decline emails
2. In `script.js`, update `EMAILJS_CONFIG` with your values:
	- `publicKey`
	- `serviceId`
	- `templateId` (confirmation template)
	- `declineTemplateId` (decline template)
3. Ensure your EmailJS template supports these variables:
	- `to_email`
	- `to_name`
	- `subject`
	- `message`

If the configuration is incomplete, consultation status updates still proceed, but email sending will fail with a clear console error.