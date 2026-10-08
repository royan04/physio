import { Activity, HeartPulse } from "lucide-react";
import "./Services.css";

const services = [
  ["Functional Electrical Stimulation", "Electrical therapy to restore muscle function and promote recovery.", "i1.jpg"],
  ["Body Weight Support Treadmill", "Assisted treadmill training for gait correction and rehabilitation.", "i2.jpg"],
  ["SaeboFlex Hand Training", "Advanced hand training to support stroke rehabilitation and dexterity.", "i3.jpg"],
  ["Cupping & Dry Needling", "Targeted pain relief and muscle relaxation through specialised therapy.", "i4.jpg"],
  ["Australian Manual Therapy", "Hands-on techniques designed to improve joint and muscle function.", "i5.jpg"],
  ["McKenzie Spine Treatment", "Evidence-based treatment for disc conditions and radiating pain.", "i6.jpg"],
  ["Joint & Replacement Rehab", "Structured recovery for arthritis, ligament injury and surgery.", "i7.jpg"],
  ["Clinical Pilates", "Guided strengthening and posture correction for back pain.", "i8.jpg"],
  ["Orthopaedic Rehabilitation", "Personalised programs for mobility and orthopaedic recovery.", "i9.jpg"],
  ["Neurological Rehabilitation", "Dedicated care for stroke, Parkinson's disease and related conditions.", "i10.jpg"],
  ["Paediatric Rehabilitation", "Supportive therapy for movement and early physical development.", "i11.jpg"],
];

export default function Services() {
  return (
    <div className="services-page">
      <header className="services-header">
        <div>
          <p className="page-eyebrow">Treatment facilities</p>
          <h1>Specialised care, all in one clinic</h1>
          <p>Explore the equipment and treatment approaches available for mobility, recovery and long-term rehabilitation.</p>
        </div>
        <div className="services-summary">
          <HeartPulse size={22} />
          <span><strong>{services.length}</strong> therapy capabilities</span>
        </div>
      </header>

      <section className="services-grid" aria-label="Clinic facilities">
        {services.map(([title, description, image], index) => (
          <article className="service-card" key={title}>
            <div className="service-image-wrap">
              <img src={`/assets/${image}`} alt={title} loading="lazy" />
              <span className="service-number">{String(index + 1).padStart(2, "0")}</span>
            </div>
            <div className="service-body">
              <Activity size={18} aria-hidden="true" />
              <div><h2>{title}</h2><p>{description}</p></div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
