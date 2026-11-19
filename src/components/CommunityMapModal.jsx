import React, { useState, useEffect, useRef } from 'react';
import { 
  X, MapPin, Navigation, Plus, Trash2, Compass, AlertCircle, 
  CheckCircle2, MapPinned, Building2, Globe
} from 'lucide-react';
import { modalEntrance } from '../utils/animations';

const INITIAL_CLOSETS = [
  { id: 1, name: 'Campus Central Library Hub', address: 'University Main Campus', lat: 23.8103, lng: 90.4125, isDefault: true },
  { id: 2, name: 'Downtown Book Café Exchange', address: '12 Mirpur Road, Dhaka', lat: 23.7509, lng: 90.3742, isDefault: true },
  { id: 3, name: 'Tech Park Reading Kiosk', address: 'Bashundhara R/A', lat: 23.8223, lng: 90.4265, isDefault: true },
  { id: 4, name: 'Riverside Community Closet', address: 'Hatirjheel Lakeside', lat: 23.7806, lng: 90.4073, isDefault: true }
];

const PRESET_CITIES = [
  { label: 'Select city preset (optional)', lat: '', lng: '' },
  { label: 'Dhaka (23.8103, 90.4125)', lat: 23.8103, lng: 90.4125 },
  { label: 'Chittagong (22.3569, 91.7832)', lat: 22.3569, lng: 91.7832 },
  { label: 'Sylhet (24.8949, 91.8687)', lat: 24.8949, lng: 91.8687 },
  { label: 'Custom (enter manually)', lat: '', lng: '' }
];

export default function CommunityMapModal({ isOpen, onClose }) {
  const modalRef = useRef(null);

  // Closets state (with localStorage persistence)
  const [closets, setClosets] = useState(() => {
    try {
      const saved = localStorage.getItem('gc_community_closets');
      return saved ? JSON.parse(saved) : INITIAL_CLOSETS;
    } catch {
      return INITIAL_CLOSETS;
    }
  });

  // Selected Coordinates for the Map
  const [selectedLocation, setSelectedLocation] = useState({
    name: INITIAL_CLOSETS[0].name,
    lat: INITIAL_CLOSETS[0].lat,
    lng: INITIAL_CLOSETS[0].lng,
    address: INITIAL_CLOSETS[0].address
  });

  // Geolocation state
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState(null); // { type: 'success'|'error', msg, coords }
  
  // New Closet Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newLat, setNewLat] = useState('');
  const [newLng, setNewLng] = useState('');
  const [formError, setFormError] = useState('');

  // GSAP entrance
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalEntrance(modalRef.current);
    }
  }, [isOpen]);

  // Persist closets to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gc_community_closets', JSON.stringify(closets));
    } catch (e) {
      console.warn('Failed to save closets to localStorage', e);
    }
  }, [closets]);

  if (!isOpen) return null;

  // Real-time Geolocation handler
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationStatus({
        type: 'error',
        msg: 'Geolocation is not supported by your browser.'
      });
      return;
    }

    setIsLocating(true);
    setLocationStatus(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const currentCoord = {
          name: 'Your Current Location',
          lat: latitude,
          lng: longitude,
          address: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`
        };

        setSelectedLocation(currentCoord);
        setIsLocating(false);
        setLocationStatus({
          type: 'success',
          msg: `Live location detected (accurate to ~${Math.round(accuracy)}m)`,
          coords: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        });
      },
      (error) => {
        setIsLocating(false);
        let errorMsg = 'Location access denied. You can still browse closet hubs below.';
        if (error.code === error.TIMEOUT) {
          errorMsg = 'Location request timed out. Please try again.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'Location information is currently unavailable.';
        }
        setLocationStatus({
          type: 'error',
          msg: errorMsg
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Preset City Dropdown change
  const handlePresetCityChange = (e) => {
    const val = e.target.value;
    const found = PRESET_CITIES.find((c) => c.label === val);
    if (found && found.lat) {
      setNewLat(found.lat.toString());
      setNewLng(found.lng.toString());
    }
  };

  // Submit New Closet Hub
  const handleSaveCloset = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newAddress.trim()) {
      setFormError('Name and Address are required.');
      return;
    }

    const parsedLat = parseFloat(newLat);
    const parsedLng = parseFloat(newLng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      setFormError('Valid Latitude and Longitude numbers are required.');
      return;
    }

    const created = {
      id: Date.now(),
      name: newName.trim(),
      address: newAddress.trim(),
      lat: parsedLat,
      lng: parsedLng,
      isDefault: false
    };

    setClosets((prev) => [created, ...prev]);
    setSelectedLocation({
      name: created.name,
      lat: created.lat,
      lng: created.lng,
      address: created.address
    });

    setNewName('');
    setNewAddress('');
    setNewLat('');
    setNewLng('');
    setFormError('');
    setIsFormOpen(false);
  };

  // Remove closet hub
  const handleRemoveCloset = (id, name) => {
    if (window.confirm(`Are you sure you want to remove the "${name}" closet hub?`)) {
      setClosets((prev) => prev.filter((c) => c.id !== id));
      if (selectedLocation.name === name) {
        const remaining = closets.filter((c) => c.id !== id);
        if (remaining.length > 0) {
          setSelectedLocation({
            name: remaining[0].name,
            lat: remaining[0].lat,
            lng: remaining[0].lng,
            address: remaining[0].address
          });
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        ref={modalRef}
        className="relative w-full max-w-5xl bg-[#181818] border border-[#292929] rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#181818] border-b border-[#292929]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#C8A96A]/15 text-[#C8A96A]">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#F7F4EB] leading-tight">
                Community Closet Hubs
              </h3>
              <p className="text-[11px] text-[#A0A0A0]">
                Find and register physical reading kiosks & book exchange dropboxes near you
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#242424] hover:bg-[#333333] text-[#A0A0A0] hover:text-[#F7F4EB] flex items-center justify-center text-sm transition-colors cursor-pointer"
            aria-label="Close Map Modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content: 2-Column Responsive Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Panel: Sidebar Directory (40% width on desktop) */}
          <div className="w-full md:w-[42%] border-b md:border-b-0 md:border-r border-[#292929] flex flex-col bg-[#1c1c1c] overflow-hidden">
            
            {/* Geolocation Section */}
            <div className="p-4 border-b border-[#292929] space-y-3">
              <button
                type="button"
                onClick={handleLocateMe}
                disabled={isLocating}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-[#C8A96A] to-[#B59659] hover:brightness-110 text-white text-xs font-semibold rounded-xl shadow transition-all cursor-pointer disabled:opacity-50"
              >
                <Navigation size={15} className={isLocating ? 'animate-spin' : ''} />
                <span>{isLocating ? 'Locating via GPS...' : 'Locate My Nearest Hub'}</span>
              </button>

              {locationStatus && (
                <div 
                  className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${
                    locationStatus.type === 'success' 
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {locationStatus.type === 'success' ? (
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium">{locationStatus.msg}</p>
                    {locationStatus.coords && (
                      <p className="text-[10px] opacity-75 font-mono mt-0.5">{locationStatus.coords}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Closet Directory Header & Add Button */}
            <div className="px-4 py-2.5 bg-[#202020] border-b border-[#292929] flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A0A0A0]">
                Active Closets ({closets.length})
              </span>
              <button
                type="button"
                onClick={() => setIsFormOpen(!isFormOpen)}
                className="flex items-center gap-1 text-xs text-[#C8A96A] hover:underline font-semibold cursor-pointer"
              >
                <Plus size={13} />
                <span>{isFormOpen ? 'Close Form' : 'Register New Hub'}</span>
              </button>
            </div>

            {/* Inline Registration Form */}
            {isFormOpen && (
              <form onSubmit={handleSaveCloset} className="p-3.5 bg-[#151515] border-b border-[#333333] space-y-2.5 animate-fadeIn">
                <span className="text-[11px] font-bold text-[#F7F4EB] block">Register Community Closet</span>
                
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Hub Name (e.g., Central Library Kiosk)"
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-[#202020] border border-[#333] text-[#F7F4EB] placeholder-[#666] focus:outline-none focus:border-[#C8A96A]"
                />

                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Street Address / Location description"
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-[#202020] border border-[#333] text-[#F7F4EB] placeholder-[#666] focus:outline-none focus:border-[#C8A96A]"
                />

                <select
                  onChange={handlePresetCityChange}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-[#202020] border border-[#333] text-[#A0A0A0] focus:outline-none focus:border-[#C8A96A] cursor-pointer"
                >
                  {PRESET_CITIES.map((c) => (
                    <option key={c.label} value={c.label}>{c.label}</option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="any"
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    placeholder="Latitude (e.g. 23.8103)"
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-[#202020] border border-[#333] text-[#F7F4EB] placeholder-[#666] focus:outline-none focus:border-[#C8A96A]"
                  />
                  <input
                    type="number"
                    step="any"
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    placeholder="Longitude (e.g. 90.4125)"
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-[#202020] border border-[#333] text-[#F7F4EB] placeholder-[#666] focus:outline-none focus:border-[#C8A96A]"
                  />
                </div>

                {formError && <p className="text-[11px] text-rose-400">{formError}</p>}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-3 py-1 text-xs text-[#A0A0A0] hover:text-[#F7F4EB]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[#C8A96A] hover:bg-[#B59659] text-black text-xs font-semibold rounded-lg"
                  >
                    Save Closet
                  </button>
                </div>
              </form>
            )}

            {/* Scrollable List of Hubs */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {closets.map((closet) => {
                const isSelected = selectedLocation.lat === closet.lat && selectedLocation.lng === closet.lng;
                return (
                  <div
                    key={closet.id}
                    onClick={() => setSelectedLocation({
                      name: closet.name,
                      lat: closet.lat,
                      lng: closet.lng,
                      address: closet.address
                    })}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-[#252525] border-l-4 border-l-[#C8A96A] border-[#3a3a3a] shadow-lg' 
                        : 'bg-[#181818] border-[#292929] hover:border-[#444] hover:bg-[#202020]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <MapPinned size={15} className={`mt-0.5 shrink-0 ${isSelected ? 'text-[#C8A96A]' : 'text-[#777]'}`} />
                        <div>
                          <p className={`text-xs font-semibold leading-tight ${isSelected ? 'text-[#C8A96A]' : 'text-[#F7F4EB]'}`}>
                            {closet.name}
                          </p>
                          <p className="text-[11px] text-[#A0A0A0] mt-0.5">
                            {closet.address}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLocation({
                              name: closet.name,
                              lat: closet.lat,
                              lng: closet.lng,
                              address: closet.address
                            });
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                            isSelected ? 'bg-[#C8A96A] text-black' : 'bg-[#252525] text-[#A0A0A0] hover:text-white'
                          }`}
                        >
                          {isSelected ? 'Viewing' : 'View'}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCloset(closet.id, closet.name);
                          }}
                          className="p-1 text-[#666] hover:text-rose-400 rounded transition-colors"
                          title="Remove hub"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 text-[10px] text-[#666666] font-mono flex items-center justify-between">
                      <span>Coordinates:</span>
                      <span>{closet.lat.toFixed(4)}, {closet.lng.toFixed(4)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Right Panel: Embedded Map (60% width on desktop) */}
          <div className="w-full md:w-[58%] h-72 md:h-auto flex flex-col bg-[#141414] relative">
            {/* Active Pin Ribbon */}
            <div className="px-4 py-2.5 bg-[#181818] border-b border-[#292929] flex items-center justify-between text-xs text-[#A0A0A0]">
              <span className="flex items-center gap-1.5 truncate">
                <MapPin size={13} className="text-[#C8A96A] shrink-0" />
                <span className="text-[#F7F4EB] font-semibold truncate">{selectedLocation.name}</span>
                <span className="opacity-75 hidden sm:inline">• {selectedLocation.address}</span>
              </span>
              <span className="font-mono text-[11px] text-[#C8A96A] shrink-0">
                {selectedLocation.lat?.toFixed(4)}, {selectedLocation.lng?.toFixed(4)}
              </span>
            </div>

            {/* Embedded Google Map iframe */}
            <div className="flex-1 w-full h-full p-2.5">
              <iframe
                className="w-full h-full rounded-2xl border border-[#333] shadow-inner"
                src={`https://maps.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}&z=15&output=embed`}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Closet Hub Location"
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

