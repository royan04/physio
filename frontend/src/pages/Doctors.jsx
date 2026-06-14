// Doctors.jsx
export default function Doctors() {
  const doctors = [
    {
      name: "Dr. Asha Menon",
      specialization: "Senior Physiotherapist",
      img: "https://via.placeholder.com/200x200?text=Dr+Asha"
    },
    {
      name: "Dr. Rahul Verma",
      specialization: "Sports Injury Specialist",
      img: "https://via.placeholder.com/200x200?text=Dr+Rahul"
    },
    {
      name: "Dr. Meera Sharma",
      specialization: "Post-Surgery Recovery Expert",
      img: "https://via.placeholder.com/200x200?text=Dr+Meera"
    }
  ];

  return (
    <div className="container my-5">
      <h2 className="text-center mb-4">Our Doctors</h2>
      <div className="row justify-content-center">
        {doctors.map((doctor, index) => (
          <div className="col-md-4 mb-4" key={index}>
            <div className="card h-100 text-center shadow-sm">
              <img
                src={doctor.img}
                className="card-img-top rounded-circle mx-auto mt-3"
                alt={doctor.name}
                style={{ width: "150px", height: "150px", objectFit: "cover" }}
              />
              <div className="card-body">
                <h5 className="card-title">{doctor.name}</h5>
                <p className="card-text">{doctor.specialization}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
