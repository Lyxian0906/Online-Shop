import { Header } from "../../components/Header";
import { Link } from "react-router";
import "./NotFound.css";

export function NotFound() {
  return (
    <>
      <Header />
      <div className="not-found-page">
        <div className="not-found-code">404</div>
        <p className="not-found-message">This page wandered off somewhere.</p>
        <Link to="/" className="not-found-link">Back to home</Link>
      </div>
    </>
  );
}