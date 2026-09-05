import React from "react";

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-opacity-50 backdrop-blur-sm z-50"
      onClick={onClose} // Closes modal when clicking the blurred background
    >
      <div
        className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative mx-4"
        onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside the box
      >
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
          onClick={onClose}
        >
          &#x2715; {/* Close button */}
        </button>
        {children}
      </div>
    </div>
  );
};

const AlertModal = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center pt-4">
        <p className="text-gray-700 text-lg font-medium">
          Attendance marked successfully!
        </p>
        <button
          className="mt-6 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
          onClick={onClose}
        >
          OK
        </button>
      </div>
    </Modal>
  );
};

const AttendenceButton = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <div className="p-4">
      <button
        type="button"
        className="px-4 py-2 rounded-lg bg-orange-500 text-white font-medium text-sm hover:bg-orange-600 transition-colors cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        Mark Attendance
      </button>
      <AlertModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default AttendenceButton;
