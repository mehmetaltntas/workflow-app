import { useState, useRef, useEffect } from "react";
import { Search, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserSearch } from "../hooks/queries/useUserSearch";
import "./UserSearchBar.css";

const UserSearchBar = () => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const { data: results = [], isLoading } = useUserSearch(debouncedQuery);

  // 300ms debounce
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  // Dropdown acik ve sonuc varsa goster
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [debouncedQuery]);

  // Disina tiklaninca kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (username: string) => {
    setIsOpen(false);
    setQuery("");
    setDebouncedQuery("");
    navigate(`/profile/${username}`);
  };

  return (
    <div className="search-bar" ref={wrapperRef}>
      <div className="search-bar__input-wrapper">
        <Search size={16} className="search-bar__icon" />
        <input
          type="text"
          className="search-bar__input"
          placeholder="Kullanici ara..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (debouncedQuery.length >= 2) setIsOpen(true);
          }}
        />
      </div>

      {isOpen && (
        <div className="search-bar__dropdown">
          {isLoading && (
            <div className="search-bar__loading">Araniyor...</div>
          )}
          {!isLoading && results.length === 0 && debouncedQuery.length >= 2 && (
            <div className="search-bar__empty">Kullanici bulunamadi</div>
          )}
          {!isLoading && results.map((user) => (
            <button
              key={user.id}
              className="search-bar__result"
              onClick={() => handleSelect(user.username)}
            >
              <div className="search-bar__avatar">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.username} />
                ) : (
                  <User size={16} />
                )}
              </div>
              <span className="search-bar__username">{user.username}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSearchBar;
