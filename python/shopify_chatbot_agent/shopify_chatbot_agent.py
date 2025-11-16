"""
Shopify Chatbot Agent - AI customer support for Shopify stores

This agent handles customer inquiries on Shopify websites, including:
- Product questions
- Order status
- Shipping information
- Returns and refunds
- General store policies
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from base.agent import BaseAgent
from typing import List, Dict, Any, Optional
import json
import re


class ShopifyChatbotAgent(BaseAgent):
    """
    A customer support chatbot agent for Shopify stores

    Features:
    - Product information lookup
    - Order tracking
    - Shipping information
    - Returns and refunds handling
    - Store policy information
    - Escalation to human support
    - Multi-language support
    - Conversation history
    - Customizable brand voice

    Example:
        agent = ShopifyChatbotAgent({
            'shopify_store_url': 'your-store.myshopify.com',
            'shopify_access_token': 'your-access-token',
            'llm_provider': 'anthropic',
            'llm_api_key': 'your-api-key',
            'store_name': 'Your Store Name',
            'brand_voice': 'friendly and helpful',
            'store_policies': {
                'shipping': 'Free shipping on orders over $50',
                'returns': '30-day return policy',
                'support_email': 'support@yourstore.com'
            }
        })

        with agent:
            response = agent.execute("What's your return policy?")
            print(response)

            # With order lookup
            response = agent.execute(
                "Where is my order #12345?",
                customer_email="customer@example.com"
            )
            print(response)
    """

    def _initialize(self) -> None:
        """Initialize Shopify chatbot agent"""
        # Shopify configuration
        self.state['shopify_store_url'] = self.config.get('shopify_store_url', '')
        self.state['shopify_access_token'] = self.config.get(
            'shopify_access_token',
            os.getenv('SHOPIFY_ACCESS_TOKEN')
        )
        self.state['shopify_api_version'] = self.config.get('shopify_api_version', '2024-01')

        # Store information
        self.state['store_name'] = self.config.get('store_name', 'Our Store')
        self.state['brand_voice'] = self.config.get('brand_voice', 'friendly and helpful')
        self.state['store_policies'] = self.config.get('store_policies', {})

        # LLM configuration
        self.state['llm_provider'] = self.config.get('llm_provider', 'anthropic')
        self.state['llm_api_key'] = self.config.get('llm_api_key', os.getenv('LLM_API_KEY'))
        self.state['model'] = self.config.get('model', 'claude-3-5-sonnet-20241022')

        # Chatbot settings
        self.state['max_history'] = self.config.get('max_history', 10)
        self.state['enable_escalation'] = self.config.get('enable_escalation', True)
        self.state['escalation_keywords'] = self.config.get(
            'escalation_keywords',
            ['speak to human', 'talk to person', 'representative', 'manager']
        )

        # Conversation state
        self.state['messages'] = []
        self.state['conversation_id'] = None
        self.state['customer_info'] = {}

        # Initialize LLM client
        self._init_llm()

        # Initialize Shopify client
        self._init_shopify()

        # Build system prompt
        self._build_system_prompt()

    def _init_llm(self) -> None:
        """Initialize LLM client"""
        provider = self.state['llm_provider']

        if provider == 'anthropic':
            try:
                import anthropic
                self.state['llm_client'] = anthropic.Anthropic(api_key=self.state['llm_api_key'])
                self.logger.info("Anthropic client initialized")
            except ImportError:
                self.logger.warning("Anthropic package not installed. Install with: pip install anthropic")
                self.state['llm_client'] = None

        elif provider == 'openai':
            try:
                import openai
                self.state['llm_client'] = openai.OpenAI(api_key=self.state['llm_api_key'])
                self.logger.info("OpenAI client initialized")
            except ImportError:
                self.logger.warning("OpenAI package not installed. Install with: pip install openai")
                self.state['llm_client'] = None

        else:
            self.state['llm_client'] = None

    def _init_shopify(self) -> None:
        """Initialize Shopify API client"""
        if self.state['shopify_store_url'] and self.state['shopify_access_token']:
            try:
                import shopify
                session = shopify.Session(
                    self.state['shopify_store_url'],
                    self.state['shopify_api_version'],
                    self.state['shopify_access_token']
                )
                shopify.ShopifyResource.activate_session(session)
                self.state['shopify_client'] = shopify
                self.logger.info("Shopify client initialized")
            except ImportError:
                self.logger.warning("Shopify package not installed. Install with: pip install ShopifyAPI")
                self.state['shopify_client'] = None
        else:
            self.state['shopify_client'] = None
            self.logger.info("Shopify credentials not provided - using mock mode")

    def _build_system_prompt(self) -> None:
        """Build the system prompt for the chatbot"""
        store_name = self.state['store_name']
        brand_voice = self.state['brand_voice']
        policies = self.state['store_policies']

        # Build policy information
        policy_text = ""
        if policies:
            policy_text = "\n\nSTORE POLICIES:\n"
            for key, value in policies.items():
                policy_text += f"- {key.replace('_', ' ').title()}: {value}\n"

        system_prompt = f"""You are a customer support assistant for {store_name}.

Your personality is {brand_voice}. Your goal is to help customers with their questions and concerns.

You can help with:
- Product information and recommendations
- Order status and tracking
- Shipping information
- Returns and refunds
- Store policies
- General inquiries

{policy_text}

IMPORTANT GUIDELINES:
1. Be helpful, patient, and understanding
2. If you don't know something, admit it and offer to escalate to a human
3. Always prioritize customer satisfaction
4. Keep responses concise and clear
5. Use the customer's name if provided
6. If asked about specific orders, products, or accounts, use the provided context
7. For complex issues or angry customers, offer to escalate to human support

When you need to escalate to human support, respond with:
"I understand this requires personal attention. Let me connect you with our support team who can better assist you."

Remember: You represent {store_name} - make every interaction count!"""

        self.state['system_prompt'] = system_prompt

        # Add system message to conversation
        self.state['messages'].append({
            'role': 'system',
            'content': system_prompt
        })

    def execute(
        self,
        message: str,
        customer_email: Optional[str] = None,
        customer_name: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        Process customer message and generate response

        Args:
            message: Customer's message
            customer_email: Customer's email (for order lookup)
            customer_name: Customer's name
            **kwargs: Additional context

        Returns:
            Chatbot response
        """
        if not self._initialized:
            self.initialize()

        # Store customer info
        if customer_email:
            self.state['customer_info']['email'] = customer_email
        if customer_name:
            self.state['customer_info']['name'] = customer_name

        # Check for escalation keywords
        if self._should_escalate(message):
            return self._escalate_to_human()

        # Extract intent and entities
        intent = self._detect_intent(message)
        self.logger.info(f"Detected intent: {intent}")

        # Gather context based on intent
        context = self._gather_context(message, intent, customer_email)

        # Generate response
        response = self._generate_response(message, context)

        return response

    def _should_escalate(self, message: str) -> bool:
        """Check if conversation should be escalated to human"""
        if not self.state['enable_escalation']:
            return False

        message_lower = message.lower()
        for keyword in self.state['escalation_keywords']:
            if keyword in message_lower:
                return True

        return False

    def _escalate_to_human(self) -> str:
        """Escalate to human support"""
        support_email = self.state['store_policies'].get('support_email', 'support@store.com')
        support_phone = self.state['store_policies'].get('support_phone', '')

        response = "I understand this requires personal attention. Let me connect you with our support team.\n\n"
        response += f"You can reach our team at:\n"
        response += f"- Email: {support_email}\n"

        if support_phone:
            response += f"- Phone: {support_phone}\n"

        response += "\nThey'll be happy to help you with your request!"

        return response

    def _detect_intent(self, message: str) -> str:
        """Detect customer intent from message"""
        message_lower = message.lower()

        # Order tracking
        if any(word in message_lower for word in ['order', 'tracking', 'where is', 'shipped', 'delivery']):
            return 'order_tracking'

        # Product inquiry
        if any(word in message_lower for word in ['product', 'item', 'available', 'stock', 'price', 'cost']):
            return 'product_inquiry'

        # Returns/refunds
        if any(word in message_lower for word in ['return', 'refund', 'exchange', 'cancel']):
            return 'returns_refunds'

        # Shipping
        if any(word in message_lower for word in ['shipping', 'delivery time', 'ship to', 'shipping cost']):
            return 'shipping_inquiry'

        # General inquiry
        return 'general_inquiry'

    def _gather_context(self, message: str, intent: str, customer_email: Optional[str]) -> str:
        """Gather relevant context based on intent"""
        context = ""

        # Extract order number from message
        order_number = self._extract_order_number(message)

        if intent == 'order_tracking' and order_number:
            order_info = self._get_order_info(order_number, customer_email)
            if order_info:
                context += f"\n\nORDER INFORMATION:\n{order_info}"

        elif intent == 'product_inquiry':
            # Extract product name/keywords
            product_keywords = self._extract_product_keywords(message)
            if product_keywords:
                product_info = self._search_products(product_keywords)
                if product_info:
                    context += f"\n\nPRODUCT INFORMATION:\n{product_info}"

        # Add relevant policies
        if intent == 'returns_refunds':
            if 'returns' in self.state['store_policies']:
                context += f"\n\nRETURN POLICY:\n{self.state['store_policies']['returns']}"

        elif intent == 'shipping_inquiry':
            if 'shipping' in self.state['store_policies']:
                context += f"\n\nSHIPPING POLICY:\n{self.state['store_policies']['shipping']}"

        return context

    def _extract_order_number(self, message: str) -> Optional[str]:
        """Extract order number from message"""
        # Look for patterns like #12345, order 12345, etc.
        patterns = [
            r'#(\d+)',
            r'order\s+(\d+)',
            r'order\s+#(\d+)',
            r'number\s+(\d+)'
        ]

        for pattern in patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                return match.group(1)

        return None

    def _extract_product_keywords(self, message: str) -> str:
        """Extract product keywords from message"""
        # Remove common words
        stop_words = {'the', 'a', 'an', 'is', 'are', 'do', 'you', 'have', 'what', 'about'}
        words = message.lower().split()
        keywords = [w for w in words if w not in stop_words and len(w) > 3]
        return ' '.join(keywords[:5])  # Top 5 keywords

    def _get_order_info(self, order_number: str, customer_email: Optional[str]) -> Optional[str]:
        """Get order information from Shopify"""
        if not self.state['shopify_client']:
            return f"Order #{order_number} (Mock data: Your order is being processed)"

        try:
            shopify = self.state['shopify_client']
            order = shopify.Order.find(order_number)

            if order:
                info = f"Order #{order.order_number}\n"
                info += f"Status: {order.financial_status} / {order.fulfillment_status or 'Unfulfilled'}\n"

                if order.fulfillments:
                    fulfillment = order.fulfillments[0]
                    info += f"Tracking: {fulfillment.tracking_number or 'Not available yet'}\n"
                    if fulfillment.tracking_url:
                        info += f"Track at: {fulfillment.tracking_url}\n"

                info += f"Total: ${order.total_price} {order.currency}\n"

                return info

        except Exception as e:
            self.logger.error(f"Error fetching order: {e}")

        return None

    def _search_products(self, keywords: str) -> Optional[str]:
        """Search for products"""
        if not self.state['shopify_client']:
            return f"Product search results for '{keywords}' (Mock data)"

        try:
            shopify = self.state['shopify_client']
            products = shopify.Product.find(limit=3)

            if products:
                info = ""
                for product in products[:3]:
                    info += f"\n- {product.title}\n"
                    if product.variants:
                        variant = product.variants[0]
                        info += f"  Price: ${variant.price}\n"
                        info += f"  Available: {'Yes' if variant.inventory_quantity > 0 else 'No'}\n"

                return info

        except Exception as e:
            self.logger.error(f"Error searching products: {e}")

        return None

    def _generate_response(self, message: str, context: str = "") -> str:
        """Generate chatbot response using LLM"""
        # Add user message to history
        user_message = message
        if context:
            user_message = f"{message}\n\n[Context: {context}]"

        self.state['messages'].append({
            'role': 'user',
            'content': user_message
        })

        # Generate response
        if not self.state['llm_client']:
            response_text = f"I'd be happy to help you with: {message}\n\n{context}"
        else:
            try:
                provider = self.state['llm_provider']

                if provider == 'anthropic':
                    client = self.state['llm_client']

                    # Separate system message
                    system_msg = self.state['system_prompt']
                    conversation = [m for m in self.state['messages'] if m['role'] != 'system']

                    response = client.messages.create(
                        model=self.state['model'],
                        max_tokens=512,
                        system=system_msg,
                        messages=conversation
                    )
                    response_text = response.content[0].text

                elif provider == 'openai':
                    client = self.state['llm_client']

                    response = client.chat.completions.create(
                        model=self.state.get('model', 'gpt-4'),
                        messages=self.state['messages'],
                        max_tokens=512
                    )
                    response_text = response.choices[0].message.content

                else:
                    response_text = "I'm here to help! Please let me know what you need."

            except Exception as e:
                self.logger.error(f"LLM error: {e}")
                response_text = "I apologize, but I'm having trouble processing that. Could you please rephrase?"

        # Add response to history
        self.state['messages'].append({
            'role': 'assistant',
            'content': response_text
        })

        # Trim history
        self._trim_history()

        return response_text

    def _trim_history(self) -> None:
        """Trim message history"""
        max_history = self.state['max_history']

        if len(self.state['messages']) > max_history + 1:
            system_msg = self.state['messages'][0]
            self.state['messages'] = [system_msg] + self.state['messages'][-(max_history):]

    def get_conversation_history(self) -> List[Dict[str, str]]:
        """Get conversation history"""
        return self.state['messages']

    def reset_conversation(self) -> None:
        """Reset conversation"""
        self.state['messages'] = [self.state['messages'][0]]  # Keep system message
        self.state['customer_info'] = {}
        self.logger.info("Conversation reset")


# Example usage
if __name__ == '__main__':
    print("Shopify Chatbot Agent Example")
    print("=" * 60)

    # Example 1: Mock mode (no API keys needed)
    agent = ShopifyChatbotAgent({
        'store_name': 'Awesome Bakery',
        'brand_voice': 'warm, friendly, and helpful like a neighborhood baker',
        'store_policies': {
            'shipping': 'Free shipping on orders over $50. Standard delivery 3-5 business days.',
            'returns': '30-day return policy for unused items in original packaging',
            'support_email': 'support@awesomebakery.com',
            'support_phone': '1-800-BAKERY1'
        }
    })

    with agent:
        print("\n1. General inquiry:")
        response = agent.execute("What's your return policy?")
        print(f"   Customer: What's your return policy?")
        print(f"   Bot: {response}\n")

        print("2. Order tracking:")
        response = agent.execute("Where is my order #12345?")
        print(f"   Customer: Where is my order #12345?")
        print(f"   Bot: {response}\n")

        print("3. Product inquiry:")
        response = agent.execute("Do you have chocolate cake available?")
        print(f"   Customer: Do you have chocolate cake available?")
        print(f"   Bot: {response}\n")

        print("4. Escalation:")
        response = agent.execute("I need to speak to a human")
        print(f"   Customer: I need to speak to a human")
        print(f"   Bot: {response}\n")

    # Example 2: With real Shopify API (commented)
    print("\nReal Shopify integration example (commented - requires credentials):")
    print("""
    agent = ShopifyChatbotAgent({
        'shopify_store_url': 'your-store.myshopify.com',
        'shopify_access_token': 'your-access-token',
        'llm_provider': 'anthropic',
        'llm_api_key': 'your-anthropic-key',
        'store_name': 'Your Store',
        'brand_voice': 'professional and helpful',
        'store_policies': {
            'shipping': 'Free shipping over $50',
            'returns': '30-day returns'
        }
    })

    with agent:
        response = agent.execute(
            "Where is my order #12345?",
            customer_email="customer@example.com"
        )
        print(response)
    """)
