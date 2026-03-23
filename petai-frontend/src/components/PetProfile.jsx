export default function PetProfile({ pet }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-bold">
        {pet.emoji} {pet.name}
      </h2>
      <p>Breed: {pet.breed}</p>
      <p>Age: {pet.age}</p>
    </div>
  );
}