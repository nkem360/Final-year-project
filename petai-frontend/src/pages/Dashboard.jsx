import PetProfile from "../components/PetProfile";

export default function Dashboard({ pet }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        Pet Dashboard
      </h1>

      <div className="grid grid-cols-3 gap-6">
        <PetProfile pet={pet} />

        <div className="bg-white p-6 rounded-xl shadow">
          <h2>Total AI Checks</h2>
          <p className="text-2xl">5</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2>Alerts</h2>
          <p className="text-red-500 text-2xl">1</p>
        </div>
      </div>
    </div>
  );
}