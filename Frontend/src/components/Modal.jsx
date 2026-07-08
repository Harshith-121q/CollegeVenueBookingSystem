import React from "react"

const Modal = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">

      {/* Background Blur */}
      <div className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm"></div>

      {/* Modal Box */}
      <div className="relative bg-white p-6 rounded-lg shadow-lg text-center w-80">
        <h2 className="text-lg font-semibold mb-4">{message}</h2>

        <button
          onClick={onClose}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          OK
        </button>
      </div>
    </div>
  )
}

export default Modal