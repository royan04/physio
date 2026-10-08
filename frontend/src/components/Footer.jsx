// Footer.jsx

export default function Footer() {
  return (
    <footer className="bg-danger text-light py-4 mt-auto">
      <div className="container text-center">
        <h5 className="fw-bold mb-3">Shreeji Physiotherapy Clinic and Rehab Centre</h5>

        <ul className="list-inline mb-3">
          <li className="list-inline-item">
            <a href="/" className="text-light text-decoration-none mx-2">Home</a>
          </li>
          <li className="list-inline-item">
            <a href="/services" className="text-light text-decoration-none mx-2">Services</a>
          </li>
          <li className="list-inline-item">
            <a href="/followup" className="text-light text-decoration-none mx-2">Follow-Up</a>
          </li>
          <li className="list-inline-item">
            <a href="/contact" className="text-light text-decoration-none mx-2">Contact</a>
          </li>
        </ul>

        <div className="mb-3">
          <a href="#" className="text-light mx-2"><i className="bi bi-facebook"></i></a>
          <a href="#" className="text-light mx-2"><i className="bi bi-twitter"></i></a>
          <a href="#" className="text-light mx-2"><i className="bi bi-instagram"></i></a>
        </div>

        <p className="mb-0">&copy; {new Date().getFullYear()} PhysioCare. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
