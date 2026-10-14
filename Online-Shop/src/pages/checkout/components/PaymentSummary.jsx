import { useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { formatMoney } from "../../../utils/money";
import "./PaymentSummary.css";

// These are TEST cards, like the ones real payment companies give to developers.
// The number you type decides what happens. No real money is ever used.
const TEST_CARDS = [
    { number: "4242424242424242", scenario: "success", label: "Always works" },
    { number: "4000000000000002", scenario: "declined", label: "Always declined" },
    { number: "4000000000009995", scenario: "insufficient_funds", label: "Not enough money" },
];

// "4242424242424242" -> "4242 4242 4242 4242"
function formatCardNumber(value) {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
}

// "1228" -> "12/28"
function formatExpiry(value) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

// The month must be 01-12 and the date can't be in the past
function isExpiryValid(expiry) {
    const match = /^(\d{2})\/(\d{2})$/.exec(expiry);
    if (!match) return false;

    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    if (month < 1 || month > 12) return false;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    return year > currentYear || (year === currentYear && month >= currentMonth);
}

// Waits some milliseconds, so "Processing..." is visible for a moment like a real payment
function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Usage (in CheckoutPage):
// <PaymentSummary paymentSummary={paymentSummary} loadCart={loadCart} />
// paymentSummary starts as null (the server hasn't answered yet),
// so the numbers and the form are only drawn when it exists.
export function PaymentSummary({ paymentSummary, loadCart }) {
    const navigate = useNavigate();

    const [cardNumber, setCardNumber] = useState("");
    const [name, setName] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");
    const [error, setError] = useState("");
    const [processing, setProcessing] = useState(false);

    // The total now comes from here, we don't need to receive it as a prop anymore.
    // The ?. is because paymentSummary is null for a moment at the start.
    const totalCents = paymentSummary?.totalCostCents;

    // The "Use this card" buttons fill the form with a test card
    const fillTestCard = (number) => {
        const nextYear = (new Date().getFullYear() + 3) % 100;
        setCardNumber(formatCardNumber(number));
        setExpiry(`12/${String(nextYear).padStart(2, "0")}`);
        setCvc("123");
        if (!name.trim()) setName("Test Customer");
        setError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        //Checks the form here in the browser first
        const digits = cardNumber.replace(/\s/g, "");

        if (!name.trim()) {
            setError("Enter the name on the card.");
            return;
        }
        if (digits.length !== 16) {
            setError("The card number must have 16 digits.");
            return;
        }
        if (!isExpiryValid(expiry)) {
            setError("The expiry date is not valid.");
            return;
        }
        if (!/^\d{3}$/.test(cvc)) {
            setError("The security code must have 3 digits.");
            return;
        }

        const testCard = TEST_CARDS.find((card) => card.number === digits);
        if (!testCard) {
            setError("This is test mode. Use one of the test cards below.");
            return;
        }

        // Sends the payment. We send ONLY the kind of card (the scenario).
        // The card number never leaves this page and is never saved anywhere.
        setProcessing(true);
        try {
            await Promise.all([
                axios.post("/api/orders", { paymentScenario: testCard.scenario }),
                wait(1200),
            ]);
        } catch (err) {
            if (err.response?.status === 401) {
                navigate("/login");
                return;
            }
            // 402 = payment declined, 409 = not enough stock, 400 = something else
            setError(err.response?.data?.error || "Something went wrong. Try again.");
            setCvc("");
            setProcessing(false);
            return;
        }

        //It worked: this is what "onSuccess" used to be.
        //The cart is empty now, so we reload it and go to the orders page
        await loadCart();
        navigate("/orders");
        setProcessing(false);
    };

    return (
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

                    {paymentSummary.totalItems > 0 ? (
                        <div className="payment-form">
                            <h2>Payment</h2>

                            <p className="payment-test-banner">
                                <strong>Test mode.</strong> No real payment is made. Never
                                type a real card number here.
                            </p>

                            <form onSubmit={handleSubmit}>
                                <label htmlFor="card-name">Name on the card</label>
                                <input
                                    id="card-name"
                                    type="text"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    autoComplete="off"
                                />

                                <label htmlFor="card-number">Card number</label>
                                <input
                                    id="card-number"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="4242 4242 4242 4242"
                                    value={cardNumber}
                                    onChange={(event) =>
                                        setCardNumber(formatCardNumber(event.target.value))
                                    }
                                    autoComplete="off"
                                />

                                <div className="payment-row">
                                    <div>
                                        <label htmlFor="card-expiry">Expiry (MM/YY)</label>
                                        <input
                                            id="card-expiry"
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="12/30"
                                            value={expiry}
                                            onChange={(event) =>
                                                setExpiry(formatExpiry(event.target.value))
                                            }
                                            autoComplete="off"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="card-cvc">Security code</label>
                                        <input
                                            id="card-cvc"
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="123"
                                            maxLength={3}
                                            value={cvc}
                                            onChange={(event) =>
                                                setCvc(event.target.value.replace(/\D/g, ""))
                                            }
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <p className="payment-error" role="alert">
                                        {error}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    className="payment-pay-button button-primary"
                                    disabled={processing}
                                >
                                    {processing
                                        ? "Processing..."
                                        : `Pay ${formatMoney(totalCents)}`}
                                </button>
                            </form>

                            <div className="payment-test-cards">
                                <h3>Test cards</h3>
                                <p>Any future date and any 3 digits work.</p>
                                <ul>
                                    {TEST_CARDS.map((card) => (
                                        <li key={card.number}>
                                            <code>{formatCardNumber(card.number)}</code>
                                            <span>{card.label}</span>
                                            <button
                                                type="button"
                                                onClick={() => fillTestCard(card.number)}
                                                disabled={processing}
                                            >
                                                Use this card
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <p>Your cart is empty.</p>
                    )}
                </>
            )}
        </div>
    );
}