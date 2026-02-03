# Pause-Before.You.Sign
A cybersecurity-based risk assessment system that helps users evaluate job and internship offers before committing or signing.

Overview

Pause – Before You Sign is a cybersecurity-based risk assessment system designed to help users evaluate job and internship offers before committing or signing. With the rise of online hiring, social engineering–based employment scams have become increasingly sophisticated, often appearing legitimate during initial interactions.

This project does not attempt to guarantee scam detection. Instead, it provides risk-based analysis using multiple technical and contextual signals, helping users make more informed and cautious decisions.

Motivation

Online job and internship platforms have become a primary target for social engineering attacks. Students and fresh graduates are particularly vulnerable due to limited industry exposure and urgency to secure opportunities.

Existing verification methods are mostly manual, inconsistent, and rely heavily on personal judgment. There is a clear need for a structured, technical approach that assists users in identifying potential risks early in the engagement process.

Problem Statement

Fake job and internship offers often appear legitimate during early stages, using professional language, realistic timelines, and fabricated digital presence. There is currently no accessible tool that helps users systematically assess the risk of such offers before committing, signing documents, or making payments.

Proposed Solution

Pause provides a multi-signal risk assessment by analyzing user-submitted offer details. Instead of relying on a single indicator, the system evaluates infrastructure legitimacy, recruiter identity consistency, and offer structure to produce an explainable risk score.

The system is designed to support decision-making rather than replace human judgment.

Key Features

User-submitted job or internship offer analysis

Infrastructure risk checks (domain age, HTTPS, domain patterns)

Recruiter identity and email consistency verification

Offer content structure and completeness analysis

Cumulative risk scoring (Low / Medium / High)

Explainable risk breakdown in plain language

Safety guidance based on assessed risk

System Architecture (High Level)

User submits offer details

Input validation and preprocessing

Independent analysis modules evaluate risk signals

Risk scoring engine aggregates signals

System outputs risk level with explanations and guidance

The architecture is modular, allowing future expansion without redesign.

Technologies Used

Backend: Python, Flask

Infrastructure Analysis: WHOIS lookup, SSL validation

Data Handling: JSON / CSV (lightweight datasets)

Security Practices: Input validation, modular rule-based analysis

Risk Assessment Philosophy

Pause follows a defense-in-depth approach. No single indicator determines whether an offer is safe or unsafe. Instead, multiple weak signals are combined to assess overall risk.

The system intentionally avoids binary decisions and instead communicates uncertainty transparently to the user.

Limitations

The system cannot guarantee scam detection at the first point of contact

Risk assessment depends on the availability of user-provided information

Newly established legitimate companies may appear higher risk initially

These limitations are acknowledged as part of responsible cybersecurity design.

Future Scope

Stage-based risk assessment across multiple interactions

Machine learning–assisted classification

Browser extension for quick checks

Scam reporting and shared intelligence database

Expanded infrastructure and identity verification

Ethical Considerations

Only user-submitted data is analyzed

No scraping of job portals or social platforms

No monitoring of private communications

User privacy and data minimization are prioritized

How to Run (Basic)

Instructions for setup and execution will be added as development progresses.

License

This project is released under the MIT License.

References

OWASP – Social Engineering

NIST Cybersecurity Framework

CERT-In Cyber Fraud Advisories

If you want next, we can:

Trim this for college submission

Write a short abstract

Create a folder structure

Start with the Flask app skeleton
