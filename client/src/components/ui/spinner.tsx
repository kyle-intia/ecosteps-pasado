function Spinner() {
  return (
    <div className="fixed inset-0 flex justify-center items-center bg-white">
      <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-green-500" />
    </div>
  );
}

export { Spinner };
