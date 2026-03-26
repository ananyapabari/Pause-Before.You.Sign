"""PDF report generation service."""

from datetime import datetime
from io import BytesIO

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from reportlab.lib import colors


class PDFService:
    """Generate professional risk analysis reports as PDF."""

    @staticmethod
    def generate_report(analysis_data: dict) -> bytes:
        """
        Generate a PDF report for an offer analysis.

        Args:
            analysis_data: Dictionary containing:
                - company_name
                - job_description
                - recruiter_email
                - company_website
                - risk_score
                - risk_level
                - scam_type
                - reasons (list)
                - ai_explanation
                - is_previously_reported
                - reports_count

        Returns:
            PDF file as bytes
        """
        pdf_buffer = BytesIO()
        doc = SimpleDocTemplate(
            pdf_buffer,
            pagesize=letter,
            rightMargin=0.75 * inch,
            leftMargin=0.75 * inch,
            topMargin=0.75 * inch,
            bottomMargin=0.75 * inch,
        )

        elements = []
        styles = getSampleStyleSheet()

        # Custom styles
        title_style = ParagraphStyle(
            "CustomTitle",
            parent=styles["Heading1"],
            fontSize=24,
            textColor=colors.HexColor("#2f6f6d"),
            spaceAfter=6,
            fontName="Helvetica-Bold",
        )

        heading_style = ParagraphStyle(
            "CustomHeading",
            parent=styles["Heading2"],
            fontSize=14,
            textColor=colors.HexColor("#2f6f6d"),
            spaceAfter=8,
            spaceBefore=10,
            fontName="Helvetica-Bold",
        )

        body_style = ParagraphStyle(
            "CustomBody",
            parent=styles["BodyText"],
            fontSize=10,
            spaceAfter=8,
            leading=14,
        )

        # Header section
        title = Paragraph("Pause Before You Sign", title_style)
        elements.append(title)

        subtitle = Paragraph(
            "Risk Analysis Report",
            ParagraphStyle(
                "Subtitle",
                parent=styles["Normal"],
                fontSize=14,
                textColor=colors.HexColor("#555555"),
                spaceAfter=4,
            ),
        )
        elements.append(subtitle)

        date_text = Paragraph(
            f"Generated: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}",
            ParagraphStyle(
                "DateText",
                parent=styles["Normal"],
                fontSize=9,
                textColor=colors.HexColor("#999999"),
                spaceAfter=12,
            ),
        )
        elements.append(date_text)
        elements.append(Spacer(1, 0.2 * inch))

        # Offer Details section
        offer_heading = Paragraph("Offer Details", heading_style)
        elements.append(offer_heading)

        offer_details = [
            ["Company", analysis_data.get("company_name", "N/A")],
            ["Email", analysis_data.get("recruiter_email", "N/A")],
            ["Website", analysis_data.get("company_website", "N/A")],
        ]
        offer_table = Table(offer_details, colWidths=[1.2 * inch, 4.3 * inch])
        offer_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#e8f5f4")),
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
                ]
            )
        )
        elements.append(offer_table)
        elements.append(Spacer(1, 0.15 * inch))

        # Risk Summary section
        risk_summary_heading = Paragraph("Risk Summary", heading_style)
        elements.append(risk_summary_heading)

        risk_level = analysis_data.get("risk_level", "UNKNOWN").upper()
        risk_color_map = {
            "LOW": colors.HexColor("#27ae60"),
            "MEDIUM": colors.HexColor("#f39c12"),
            "HIGH": colors.HexColor("#e74c3c"),
        }
        risk_color = risk_color_map.get(risk_level, colors.black)

        risk_summary = [
            ["Risk Score", f"{analysis_data.get('risk_score', 0)}/100"],
            ["Risk Level", risk_level],
            ["Scam Type", analysis_data.get("scam_type", "Unknown")],
        ]
        risk_table = Table(risk_summary, colWidths=[1.2 * inch, 4.3 * inch])
        risk_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#e8f5f4")),
                    ("BACKGROUND", (1, 1), (1, 1), risk_color),
                    ("TEXTCOLOR", (1, 1), (1, 1), colors.whitesmoke),
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
                ]
            )
        )
        elements.append(risk_table)
        elements.append(Spacer(1, 0.15 * inch))

        # Key Risk Indicators section
        reasons = analysis_data.get("reasons", [])
        if reasons:
            indicators_heading = Paragraph("Key Risk Indicators", heading_style)
            elements.append(indicators_heading)

            for reason in reasons:
                reason_text = Paragraph(f"• {reason}", body_style)
                elements.append(reason_text)
            elements.append(Spacer(1, 0.1 * inch))

        # AI Explanation section
        ai_explanation = analysis_data.get("ai_explanation")
        if ai_explanation:
            analysis_heading = Paragraph("AI Analysis", heading_style)
            elements.append(analysis_heading)

            explanation_text = Paragraph(
                ai_explanation.replace("\n", "<br/>"), body_style
            )
            elements.append(explanation_text)
            elements.append(Spacer(1, 0.1 * inch))

        # Community Reports section
        if analysis_data.get("is_previously_reported"):
            community_heading = Paragraph("Community Reports", heading_style)
            elements.append(community_heading)

            report_count = analysis_data.get("reports_count", 0)
            community_text = Paragraph(
                f"⚠ This offer has been reported as a scam by {report_count} user(s) in our community.",
                ParagraphStyle(
                    "CommunityText",
                    parent=styles["Normal"],
                    fontSize=10,
                    textColor=colors.HexColor("#e74c3c"),
                    spaceAfter=8,
                ),
            )
            elements.append(community_text)
            elements.append(Spacer(1, 0.1 * inch))

        # Safety Recommendation section
        recommendation_heading = Paragraph("Safety Recommendation", heading_style)
        elements.append(recommendation_heading)

        if risk_level == "HIGH":
            recommendation = (
                "Do not proceed with this offer. Verify the company's legitimacy through official channels "
                "before responding to any requests or sharing personal information."
            )
            rec_color = colors.HexColor("#e74c3c")
        elif risk_level == "MEDIUM":
            recommendation = (
                "Exercise caution with this offer. Independently verify the recruiter's identity and company "
                "details through official sources before proceeding."
            )
            rec_color = colors.HexColor("#f39c12")
        else:
            recommendation = (
                "This offer appears safe, but always verify company details through official channels "
                "before sharing sensitive information."
            )
            rec_color = colors.HexColor("#27ae60")

        recommendation_text = Paragraph(
            recommendation,
            ParagraphStyle(
                "RecommendationText",
                parent=styles["Normal"],
                fontSize=10,
                textColor=rec_color,
                spaceAfter=8,
                leading=14,
            ),
        )
        elements.append(recommendation_text)
        elements.append(Spacer(1, 0.2 * inch))

        # Footer
        footer_text = Paragraph(
            "This report is generated by Pause Before You Sign to help you assess job offer risks. "
            "Always use multiple sources to verify company legitimacy.",
            ParagraphStyle(
                "FooterText",
                parent=styles["Normal"],
                fontSize=8,
                textColor=colors.HexColor("#999999"),
                spaceAfter=4,
            ),
        )
        elements.append(footer_text)

        # Build PDF
        doc.build(elements)
        pdf_buffer.seek(0)
        return pdf_buffer.getvalue()
