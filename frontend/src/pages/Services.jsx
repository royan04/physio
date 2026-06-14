// src/pages/Services.jsx
import React from "react";
import "./Services.css";

export default function Services() {
  const services = [
    {
      title: "Functional Electrical Stimulation",
      description: "Electrical therapy to restore muscle function and promote recovery.",
      img: "../assets/i1.jpg",
    },
    {
      title: "Body Weight Support System Treadmill",
      description: "Assisted treadmill training for gait correction and rehabilitation.",
      img: "../assets/i2.jpg",
    },
    {
      title: "Saebotlex for Stroke Patient Hand Training",
      description: "Advanced robotic hand training for improved stroke rehabilitation.",
      img: "../assets/i3.jpg",
    },
    {
      title: "Cupping & Dry Needle Therapy",
      description: "Pain relief and muscle relaxation through specialized therapeutic methods.",
      img: "../assets/i4.jpg",
    },
    {
      title: "Australian Standard Manual Therapy",
      description: "Hands-on physiotherapy techniques to enhance joint and muscle function.",
      img: "../assets/i5.jpg",
    },
    {
      title: "McKenzie Treatment for Disc & Radiating Pain",
      description: "Evidence-based spine treatment for disc and nerve pain relief.",
      img: "../assets/i6.jpg",
    },
    {
      title: "Rehab for Joint Pain & Replacement",
      description: "Comprehensive rehab for arthritis, ligament injury, and post-surgery recovery.",
      img: "../assets/i7.jpg",
    },
    {
      title: "Pilates for Back Pain",
      description: "Strengthening and posture correction through Pilates exercises.",
      img: "../assets/i8.jpg",
    },
    {
      title: "Orthopaedic Patient Rehab",
      description: "Tailored therapy programs for orthopaedic recovery and mobility restoration.",
      img: "../assets/i9.jpg",
    },
    {
      title: "Neurological Patient Rehab",
      description: "Special care for neurological disorders like stroke and Parkinson’s disease.",
      img: "../assets/i10.jpg",
    },
    {
      title: "Paediatric Patient Rehab",
      description: "Child-friendly therapy programs to support early physical development.",
      img: "../assets/i11.jpg",
    },
  ];

  return (
    <div className="services-page">
      <div className="container my-5">
        <h2 className="text-center mb-4 text-danger fw-bold">Our Facilities</h2>
        <div className="row justify-content-center">
          {services.map((service, index) => (
            <div className="col-md-6 col-lg-4 mb-4" key={index}>
              <div className="card h-100 shadow border-0 hover-shadow transition-all">
                <img
                  src={service.img}
                  className="card-img-top"
                  alt={service.title}
                />
                <div className="card-body text-center">
                  <h5 className="card-title text-danger fw-semibold">
                    {service.title}
                  </h5>
                  <p className="card-text text-muted">{service.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
