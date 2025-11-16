"""
Email Automation Agent - Intelligent email handling and automation

Auto-respond to customer emails, classify inquiries, draft responses,
analyze sentiment, and manage email workflows
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from base.agent import BaseAgent
from typing import List, Dict, Any, Optional
import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


class EmailAutomationAgent(BaseAgent):
    """
    Intelligent email automation agent for customer service

    Features:
    - Email classification (order inquiry, complaint, question, spam)
    - Auto-draft responses
    - Sentiment analysis
    - Priority detection
    - Template management
    - Auto-forwarding rules
    - Email parsing (extract order numbers, dates, etc.)
    - Multi-language support

    Example:
        agent = EmailAutomationAgent({
            'llm_provider': 'anthropic',
            'llm_api_key': 'your-key',
            'company_name': 'Your Company',
            'support_email': 'support@company.com',
            'auto_respond': True,
            'templates': {
                'order_inquiry': 'Thank you for your order inquiry...',
                'complaint': 'We apologize for the inconvenience...'
            }
        })

        with agent:
            result = agent.execute(
                email_subject="Where is order #12345?",
                email_body="I ordered last week...",
                from_email="customer@example.com"
            )

            print(f"Category: {result['category']}")
            print(f"Priority: {result['priority']}")
            print(f"Response: {result['response']}")
    """

    def _initialize(self) -> None:
        """Initialize email automation agent"""
        # LLM configuration
        self.state['llm_provider'] = self.config.get('llm_provider', 'anthropic')
        self.state['llm_api_key'] = self.config.get('llm_api_key', os.getenv('LLM_API_KEY'))
        self.state['model'] = self.config.get('model', 'claude-3-5-sonnet-20241022')

        # Company configuration
        self.state['company_name'] = self.config.get('company_name', 'Our Company')
        self.state['support_email'] = self.config.get('support_email', 'support@company.com')
        self.state['business_hours'] = self.config.get('business_hours', 'Mon-Fri 9AM-5PM')

        # Email automation settings
        self.state['auto_respond'] = self.config.get('auto_respond', True)
        self.state['signature'] = self.config.get('signature', f"Best regards,\n{self.state['company_name']} Support Team")

        # Email templates
        self.state['templates'] = self.config.get('templates', {})

        # Categories
        self.state['categories'] = [
            'order_inquiry',
            'shipping_question',
            'complaint',
            'product_question',
            'refund_request',
            'technical_support',
            'general_question',
            'spam'
        ]

        # Initialize LLM
        self._init_llm()

    def _init_llm(self) -> None:
        """Initialize LLM client"""
        provider = self.state['llm_provider']

        if provider == 'anthropic':
            try:
                import anthropic
                self.state['llm_client'] = anthropic.Anthropic(api_key=self.state['llm_api_key'])
                self.logger.info("Anthropic client initialized")
            except ImportError:
                self.logger.warning("Anthropic package not installed")
                self.state['llm_client'] = None
        elif provider == 'openai':
            try:
                import openai
                self.state['llm_client'] = openai.OpenAI(api_key=self.state['llm_api_key'])
                self.logger.info("OpenAI client initialized")
            except ImportError:
                self.logger.warning("OpenAI package not installed")
                self.state['llm_client'] = None
        else:
            self.state['llm_client'] = None

    def execute(
        self,
        email_subject: str,
        email_body: str,
        from_email: str,
        from_name: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Process incoming email

        Args:
            email_subject: Email subject line
            email_body: Email body content
            from_email: Sender's email address
            from_name: Sender's name (optional)
            **kwargs: Additional context

        Returns:
            Dictionary with:
            - category: Email category
            - priority: Priority level (high, medium, low)
            - sentiment: Sentiment analysis (positive, neutral, negative)
            - response: Auto-generated response
            - extracted_data: Order numbers, dates, etc.
            - should_escalate: Whether to escalate to human
        """
        if not self._initialized:
            self.initialize()

        # Classify email
        category = self._classify_email(email_subject, email_body)

        # Analyze sentiment
        sentiment = self._analyze_sentiment(email_body)

        # Determine priority
        priority = self._determine_priority(category, sentiment, email_subject, email_body)

        # Extract data
        extracted_data = self._extract_data(email_subject, email_body)

        # Check if should escalate
        should_escalate = self._should_escalate(category, sentiment, priority)

        # Generate response
        response = self._generate_response(
            category=category,
            subject=email_subject,
            body=email_body,
            from_name=from_name or from_email.split('@')[0],
            extracted_data=extracted_data,
            sentiment=sentiment
        )

        result = {
            'category': category,
            'priority': priority,
            'sentiment': sentiment,
            'response': response,
            'extracted_data': extracted_data,
            'should_escalate': should_escalate,
            'from_email': from_email,
            'from_name': from_name
        }

        self.logger.info(f"Processed email: {category} | {priority} priority | {sentiment} sentiment")

        return result

    def _classify_email(self, subject: str, body: str) -> str:
        """Classify email into category"""
        if not self.state['llm_client']:
            # Simple keyword-based classification
            text = (subject + ' ' + body).lower()

            if any(word in text for word in ['order', 'tracking', 'shipment', 'delivery']):
                return 'order_inquiry'
            elif any(word in text for word in ['complaint', 'disappointed', 'angry', 'terrible', 'worst']):
                return 'complaint'
            elif any(word in text for word in ['refund', 'return', 'money back']):
                return 'refund_request'
            elif any(word in text for word in ['product', 'item', 'available', 'stock']):
                return 'product_question'
            elif any(word in text for word in ['viagra', 'casino', 'lottery', 'click here']):
                return 'spam'
            else:
                return 'general_question'

        # Use LLM for classification
        prompt = f"""Classify this email into one of these categories:
{', '.join(self.state['categories'])}

Subject: {subject}
Body: {body}

Respond with ONLY the category name, nothing else."""

        try:
            if self.state['llm_provider'] == 'anthropic':
                response = self.state['llm_client'].messages.create(
                    model=self.state['model'],
                    max_tokens=50,
                    messages=[{'role': 'user', 'content': prompt}]
                )
                category = response.content[0].text.strip().lower()
            else:
                response = self.state['llm_client'].chat.completions.create(
                    model=self.state['model'],
                    messages=[{'role': 'user', 'content': prompt}],
                    max_tokens=50
                )
                category = response.choices[0].message.content.strip().lower()

            return category if category in self.state['categories'] else 'general_question'
        except:
            return 'general_question'

    def _analyze_sentiment(self, text: str) -> str:
        """Analyze sentiment of email"""
        text_lower = text.lower()

        # Negative indicators
        negative_words = ['angry', 'disappointed', 'terrible', 'worst', 'horrible',
                         'unacceptable', 'frustrated', 'upset', 'annoyed']

        # Positive indicators
        positive_words = ['thank', 'great', 'excellent', 'love', 'happy',
                         'appreciate', 'wonderful', 'perfect']

        negative_score = sum(1 for word in negative_words if word in text_lower)
        positive_score = sum(1 for word in positive_words if word in text_lower)

        if negative_score > positive_score:
            return 'negative'
        elif positive_score > negative_score:
            return 'positive'
        else:
            return 'neutral'

    def _determine_priority(self, category: str, sentiment: str, subject: str, body: str) -> str:
        """Determine email priority"""
        # High priority indicators
        high_priority_words = ['urgent', 'asap', 'immediately', 'emergency', 'critical']

        text = (subject + ' ' + body).lower()

        if any(word in text for word in high_priority_words):
            return 'high'

        if category in ['complaint', 'refund_request'] or sentiment == 'negative':
            return 'high'

        if category in ['order_inquiry', 'shipping_question']:
            return 'medium'

        return 'low'

    def _extract_data(self, subject: str, body: str) -> Dict[str, Any]:
        """Extract structured data from email"""
        text = subject + ' ' + body

        data = {}

        # Extract order numbers
        order_patterns = [
            r'#(\d+)',
            r'order\s+(\d+)',
            r'order\s+#(\d+)',
            r'order\s+number\s+(\d+)'
        ]

        for pattern in order_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                data['order_number'] = match.group(1)
                break

        # Extract tracking numbers
        tracking_match = re.search(r'(?:tracking|track)[\s:#]*([A-Z0-9]{10,})', text, re.IGNORECASE)
        if tracking_match:
            data['tracking_number'] = tracking_match.group(1)

        # Extract dollar amounts
        amount_match = re.search(r'\$(\d+(?:\.\d{2})?)', text)
        if amount_match:
            data['amount'] = amount_match.group(1)

        # Extract dates (simple patterns)
        date_match = re.search(r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', text)
        if date_match:
            data['date'] = date_match.group(1)

        return data

    def _should_escalate(self, category: str, sentiment: str, priority: str) -> bool:
        """Determine if email should be escalated to human"""
        if priority == 'high' and sentiment == 'negative':
            return True

        if category in ['complaint', 'refund_request']:
            return True

        if category == 'spam':
            return False

        return False

    def _generate_response(
        self,
        category: str,
        subject: str,
        body: str,
        from_name: str,
        extracted_data: Dict[str, Any],
        sentiment: str
    ) -> str:
        """Generate email response"""
        # Check for template
        if category in self.state['templates']:
            template = self.state['templates'][category]
            response = template.format(
                name=from_name,
                company=self.state['company_name'],
                **extracted_data
            )
            return response + '\n\n' + self.state['signature']

        # Use LLM to generate response
        if not self.state['llm_client']:
            return self._generate_default_response(category, from_name, extracted_data)

        # Build context for LLM
        context = f"""You are writing a customer service email response for {self.state['company_name']}.

Original Email Subject: {subject}
Original Email Body: {body}

Customer Name: {from_name}
Email Category: {category}
Sentiment: {sentiment}
Extracted Data: {extracted_data}

Write a professional, helpful email response. Be empathetic if the sentiment is negative.
Keep it concise (2-3 paragraphs). Address the customer's concern directly.

Do not include subject line or signature - just the body."""

        try:
            if self.state['llm_provider'] == 'anthropic':
                response = self.state['llm_client'].messages.create(
                    model=self.state['model'],
                    max_tokens=500,
                    messages=[{'role': 'user', 'content': context}]
                )
                email_body = response.content[0].text.strip()
            else:
                response = self.state['llm_client'].chat.completions.create(
                    model=self.state['model'],
                    messages=[{'role': 'user', 'content': context}],
                    max_tokens=500
                )
                email_body = response.choices[0].message.content.strip()

            return email_body + '\n\n' + self.state['signature']
        except Exception as e:
            self.logger.error(f"Error generating response: {e}")
            return self._generate_default_response(category, from_name, extracted_data)

    def _generate_default_response(self, category: str, from_name: str, extracted_data: Dict) -> str:
        """Generate default response without LLM"""
        responses = {
            'order_inquiry': f"Hi {from_name},\n\nThank you for contacting us about your order. We're looking into this and will get back to you shortly.\n\n{self.state['signature']}",
            'complaint': f"Hi {from_name},\n\nWe sincerely apologize for your experience. This is not the level of service we strive to provide. A member of our team will reach out to you within 24 hours to resolve this.\n\n{self.state['signature']}",
            'refund_request': f"Hi {from_name},\n\nWe've received your refund request. Our team is processing this and you should receive an update within 1-2 business days.\n\n{self.state['signature']}",
            'product_question': f"Hi {from_name},\n\nThank you for your interest in our products. One of our product specialists will respond to your question shortly.\n\n{self.state['signature']}",
        }

        return responses.get(category, f"Hi {from_name},\n\nThank you for contacting {self.state['company_name']}. We've received your message and will respond soon.\n\n{self.state['signature']}")

    def create_email_message(self, result: Dict[str, Any], subject: str = None) -> MIMEMultipart:
        """Create email message object"""
        msg = MIMEMultipart()
        msg['From'] = self.state['support_email']
        msg['To'] = result['from_email']
        msg['Subject'] = subject or f"Re: {result.get('original_subject', 'Your inquiry')}"

        msg.attach(MIMEText(result['response'], 'plain'))

        return msg


# Example usage
if __name__ == '__main__':
    print("Email Automation Agent Example")
    print("=" * 60)

    agent = EmailAutomationAgent({
        'company_name': 'Awesome Bakery',
        'support_email': 'support@awesomebakery.com',
        'business_hours': 'Mon-Fri 9AM-6PM',
        'auto_respond': True
    })

    with agent:
        # Example 1: Order inquiry
        print("\n1. Order Inquiry:")
        result = agent.execute(
            email_subject="Where is my order?",
            email_body="Hi, I ordered a chocolate cake last week (order #12345) but haven't received it yet. Can you help?",
            from_email="customer@example.com",
            from_name="John"
        )
        print(f"   Category: {result['category']}")
        print(f"   Priority: {result['priority']}")
        print(f"   Sentiment: {result['sentiment']}")
        print(f"   Escalate: {result['should_escalate']}")
        print(f"   Extracted: {result['extracted_data']}")
        print(f"\n   Response:\n{result['response'][:200]}...")

        # Example 2: Complaint
        print("\n2. Complaint:")
        result = agent.execute(
            email_subject="Very disappointed",
            email_body="The cake I received was terrible and arrived damaged. This is unacceptable!",
            from_email="angry@example.com",
            from_name="Sarah"
        )
        print(f"   Category: {result['category']}")
        print(f"   Priority: {result['priority']}")
        print(f"   Sentiment: {result['sentiment']}")
        print(f"   Escalate: {result['should_escalate']}")
