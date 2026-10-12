import { useState } from "react";
import { formatMoney } from "../../../utils/money";
import { useNavigate } from "react-router";
import axios from "axios";

// The fake "test cards": the number you type decides what happens.
// We only send the result name (scenario) to the server, never the card number.
const TEST_CARDS = {
    "4242424242424242": "success",
    "4000000000000002": "declined",
    "4000000000009995": "insufficient_funds",
};

export function PaymentSummary({paymentSummary, loadCart}){
    const navigate = useNavigate();
    const [cardNumber, setCardNumber] = useState("");
    const [error, setError] = useState("");
    const [paying, setPaying] = useState(false);

    const createOrder = async () => {
        const scenario = TEST_CARDS[cardNumber.replace(/\s/g, "")];
        if (!scenario) {
            setError("Use a test card, for example 4242 4242 4242 4242");
            return;
        }

        setError("");
        setPaying(true);
        try {
            await axios.post('/api/orders', { scenario });
            await loadCart();
            navigate('/orders');
        } catch (err) {
            // The backend sends messages like "Your card was declined."
            // or "Sold out: ..." inside err.response.data.error
            setError(err.response?.data?.error || "Payment failed");
        } finally {
            setPaying(false);
        }
    };
/*
    When we create an order our cart is gonna be empty so we also need to reload the cart


    Then we are gonna navigate to another page, in this case the order so we can check our order,
    navigate is not async, it loads inmediately
*/
    return(
        <div className="payment-summary">
                                <div className="payment-summary-title">Payment Summary</div>
                                {paymentSummary && (
                                    <>
                                        <div className="payment-summary-row">
                                            <div>Items ({paymentSummary.totalItems}):</div>
                                            <div className="payment-summary-money">
                                                {formatMoney(paymentSummary.productCostCents)}
                                            </div>
                                        </div>
                                        <div className="payment-summary-row">
                                            <div>Shipping &amp; handling:</div>
                                            <div className="payment-summary-money">
                                                {formatMoney(paymentSummary.shippingCostCents)}
                                            </div>
                                        </div>
                                        <div className="payment-summary-row subtotal-row">
                                            <div>Total before tax:</div>
                                            <div className="payment-summary-money">
                                                {formatMoney(paymentSummary.totalCostBeforeTaxCents)}
                                            </div>
                                        </div>
                                        <div className="payment-summary-row">
                                            <div>Estimated tax (10%):</div>
                                            <div className="payment-summary-money">
                                                {formatMoney(paymentSummary.taxCents)}
                                            </div>
                                        </div>
                                        <div className="payment-summary-row total-row">
                                            <div>Order total:</div>
                                            <div className="payment-summary-money">
                                                {formatMoney(paymentSummary.totalCostCents)}
                                            </div>
                                        </div>

                                        <input
                                            type="text"
                                            placeholder="Test card: 4242 4242 4242 4242"
                                            value={cardNumber}
                                            onChange={(event) => setCardNumber(event.target.value)}
                                            style={{ width: "100%", boxSizing: "border-box", padding: 8, marginTop: 12 }}
                                        />

                                        {error && (
                                            <div style={{ color: "red", marginTop: 8 }}>{error}</div>
                                        )}

                                        <button className="place-order-button button-primary"
                                        onClick={createOrder}
                                        disabled={paying}>
                                            {paying ? "Processing..." : "Place your order"}
                                        </button>
                                    </>
                                )}
                            </div>
    );
}