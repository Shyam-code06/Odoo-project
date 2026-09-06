import React, { useState, useEffect } from "react";
import { attendanceService } from "../../services/attendanceService";
import { useAuth } from "../../contexts/AuthContext";

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full relative mx-4 border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 text-lg font-bold"
          onClick={onClose}
        >
          &#x2715;
        </button>
        {children}
      </div>
    </div>
  );
};

const AlertModal = ({ isOpen, onClose, title, message, isError }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center pt-2">
        <h3 className={`text-base font-bold mb-2 ${isError ? 'text-rose-600' : 'text-slate-900'}`}>
          {title || (isError ? 'Attendance Error' : 'Attendance Notice')}
        </h3>
        <p className="text-slate-600 text-sm font-medium whitespace-pre-line">
          {message}
        </p>
        <button
          className="mt-6 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors text-sm cursor-pointer"
          onClick={onClose}
        >
          OK
        </button>
      </div>
    </Modal>
  );
};

const AttendenceButton = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [todayStatus, setTodayStatus] = useState(null);
  const [processing, setProcessing] = useState(false);

  const fetchStatus = async () => {
    if (!user?.employee_id) return;
    try {
      const res = await attendanceService.getTodayStatus();
      if (res?.data) {
        setTodayStatus(res.data);
      }
    } catch {
      // Ignored for non-employee or offline
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [user?.employee_id]);

  const handleMarkAttendance = async () => {
    if (processing) return;

    setProcessing(true);
    try {
      // 1. Retrieve real device GPS coordinates
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser. Real GPS coordinates are required for on-site attendance verification.');
      }

      let coords = null;
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });
        if (pos && pos.coords) {
          coords = {
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
          };
        }
      } catch (geoErr) {
        if (geoErr.code === 1) {
          // PERMISSION_DENIED
          throw new Error('Location permission was denied. Please enable location access in your browser settings to verify on-site attendance.');
        } else if (geoErr.code === 2) {
          // POSITION_UNAVAILABLE
          throw new Error('GPS position is currently unavailable. Please ensure your device location services are enabled.');
        } else if (geoErr.code === 3) {
          // TIMEOUT
          throw new Error('Location request timed out. Please check your GPS signal and try again.');
        } else {
          throw new Error('Could not acquire your GPS location. On-site attendance verification requires real location access.');
        }
      }

      if (!coords || coords.latitude === undefined || coords.longitude === undefined) {
        throw new Error('Unable to determine your GPS coordinates. Please enable location services and try again.');
      }

      // Check current today status
      const statusRes = await attendanceService.getTodayStatus();
      const status = statusRes?.data;
      setTodayStatus(status);

      if (!status?.has_checked_in) {
        // Record Check In
        const checkInRes = await attendanceService.checkIn(coords);
        if (checkInRes?.success) {
          setIsError(false);
          setModalTitle('Check-In Successful');
          setModalMessage(`Checked in successfully for today.\nStatus: ${checkInRes.data?.status || 'Present'}`);
          setIsModalOpen(true);
          await fetchStatus();
        } else {
          throw new Error(checkInRes?.message || 'Check-in failed');
        }
      } else if (!status?.has_checked_out) {
        // Record Check Out
        const checkOutRes = await attendanceService.checkOut(coords);
        if (checkOutRes?.success) {
          setIsError(false);
          setModalTitle('Check-Out Successful');
          const worked = checkOutRes.data?.worked_hours || ((checkOutRes.data?.worked_minutes || 0) / 60).toFixed(1);
          setModalMessage(`Checked out successfully.\nTotal time worked: ${worked} hours.`);
          setIsModalOpen(true);
          await fetchStatus();
        } else {
          throw new Error(checkOutRes?.message || 'Check-out failed');
        }
      } else {
        // Already checked in and checked out
        setIsError(false);
        setModalTitle('Attendance Already Completed');
        setModalMessage(`You have already completed attendance for today.\nChecked in: ${status.record?.check_in || 'Yes'}\nChecked out: ${status.record?.check_out || 'Yes'}`);
        setIsModalOpen(true);
      }
    } catch (err) {
      setIsError(true);
      setModalTitle('Attendance Verification Failed');
      setModalMessage(err.message || 'Unable to record attendance at this time.');
      setIsModalOpen(true);
    } finally {
      setProcessing(false);
    }
  };

  const buttonLabel = processing
    ? 'Saving attendance...'
    : !todayStatus?.has_checked_in
    ? 'Mark Attendance (Click to Check In)'
    : !todayStatus?.has_checked_out
    ? 'Check Out (Click to Check Out)'
    : 'Attendance Completed for Today';

  const currentEmoji = processing
    ? '⏳'
    : !todayStatus?.has_checked_in
    ? '⏰'
    : !todayStatus?.has_checked_out
    ? '🏃'
    : '✅';

  // Dynamic styling: Red circle when absent / ready to check-in, Green circle when already checked-in, Amber when processing
  const circleColor = processing
    ? 'bg-amber-500 hover:bg-amber-600 ring-amber-300'
    : !todayStatus?.has_checked_in
    ? 'bg-red-500 hover:bg-red-600 ring-red-300'
    : !todayStatus?.has_checked_out
    ? 'bg-emerald-500 hover:bg-emerald-600 ring-emerald-300'
    : 'bg-emerald-600 hover:bg-emerald-700 ring-emerald-400';

  const hoverText = processing
    ? 'Verifying Attendance...'
    : !todayStatus?.has_checked_in
    ? 'Mark Attendance'
    : !todayStatus?.has_checked_out
    ? 'Check Out Attendance'
    : 'Attendance Completed';

  return (
    <div className="relative group flex items-center justify-center">
      <button
        type="button"
        disabled={processing}
        onClick={handleMarkAttendance}
        aria-label={hoverText}
        className={`relative w-9 h-9 rounded-full ${circleColor} text-white flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60 ring-2 ring-offset-2 ring-offset-white`}
      >
        <span className={`text-base select-none ${processing ? 'animate-spin' : ''}`}>
          {currentEmoji}
        </span>

        {/* Small pulsing presence dot for when user has not checked in */}
        {!todayStatus?.has_checked_in && !processing && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 border border-white" />
          </span>
        )}
      </button>

      {/* Floating Instant Hover Tooltip */}
      <div className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 transform group-hover:translate-y-0 translate-y-1 z-50 flex flex-col items-center">
        <div className="w-2 h-2 bg-slate-900 rotate-45 -mb-1 shadow-xs" />
        <div className="bg-slate-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-md shadow-xl whitespace-nowrap flex items-center gap-1.5 border border-slate-800">
          <span className="text-xs">{currentEmoji}</span>
          <span>{hoverText}</span>
        </div>
      </div>
      <AlertModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        message={modalMessage}
        isError={isError}
      />
    </div>
  );
};

export default AttendenceButton;
