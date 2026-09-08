// client/src/components/common/Icons.jsx
import React from "react";

// The exact location pin icon style you provided
export function LocationIcon({ className = "w-3 h-3", ...props }) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M6 0C3.349 0 1.2 2.402 1.2 5.1c0 2.677 1.532 5.587 3.922 6.705a2.07 2.07 0 0 0 1.756 0C9.268 10.687 10.8 7.777 10.8 5.1 10.8 2.402 8.651 0 6 0zm0 6a1.2 1.2 0 1 0 0-2.4A1.2 1.2 0 0 0 6 6z"
        fillRule="evenodd"
      />
    </svg>
  );
}

// Sleek Solid Search Icon
export function SearchIcon({ className = "w-4 h-4", ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
    </svg>
  );
}

// Sleek Academic Graduation Cap
export function GraduationCapIcon({ className = "w-5 h-5", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M12 2L1 8l11 6 9-4.91V17h2V8L12 2zm0 15.5c-3.72 0-6.85-2.06-8-5v4c1.15 2.94 4.28 5 8 5s6.85-2.06 8-5v-4c-1.15 2.94-4.28 5-8 5z" />
    </svg>
  );
}

// University / Institution Pillar Icon
export function UniversityIcon({ className = "w-4 h-4", ...props }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M8 1L0 5v2h1v7H0v1h16v-1h-1V7h1V5L8 1zm-5 6h2v6H3V7zm4 0h2v6H7V7zm4 0h2v6h-2V7zM8 3.236L12.528 5.5H3.472L8 3.236z" />
    </svg>
  );
}

// Compact Globe / Language Icon
export function GlobeIcon({ className = "w-3.5 h-3.5", ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m7.5-6.923c-.67.204-1.335.82-1.887 1.855A8 8 0 0 0 5.145 4H7.5zM4.09 4a9.3 9.3 0 0 1 .64-1.539 7 7 0 0 1 .597-.933A7.03 7.03 0 0 0 2.255 4zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a7 7 0 0 0-.656 2.5zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5zM8.5 5v2.5h2.99a12.5 12.5 0 0 0-.337-2.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5zM5.145 12q.208.58.468 1.068c.552 1.035 1.218 1.65 1.887 1.855V12zm.182 2.472a7 7 0 0 1-.597-.933A9.3 9.3 0 0 1 4.09 12H2.255a7 7 0 0 0 3.072 2.472M3.82 11a13.7 13.7 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5zm6.853 3.472A7 7 0 0 0 13.745 12H11.91a9.3 9.3 0 0 1-.64 1.539 7 7 0 0 1-.597.933M8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855q.26-.487.468-1.068zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.7 13.7 0 0 1-.312 2.5m2.802-3.5a7 7 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7 7 0 0 0-3.072-2.472c.218.284.418.598.597.933M10.855 4a8 8 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4z" />
    </svg>
  );
}

// Euro / Tuition Fee Icon
export function EuroIcon({ className = "w-3.5 h-3.5", ...props }) {
  return (
    <svg
      _ngcontent-ng-c2658218023=""
      width="12"
      height="12"
      viewBox="0 0 12 12"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        _ngcontent-ng-c2658218023=""
        d="M6 11.6A5.6 5.6 0 1 0 6 .4a5.6 5.6 0 0 0 0 11.2zM3.06 6c0-.143.01-.283.03-.42h1.79a.42.42 0 0 0 0-.84H3.343A2.94 2.94 0 0 1 7.47 3.453a.42.42 0 1 0 .42-.727A3.782 3.782 0 0 0 2.435 4.74H2.08a.42.42 0 0 0 0 .84h.163a3.82 3.82 0 0 0 0 .84H2.08a.42.42 0 0 0 0 .84h.355A3.782 3.782 0 0 0 7.89 9.274a.42.42 0 1 0-.42-.727A2.94 2.94 0 0 1 3.343 7.26H4.88a.42.42 0 0 0 0-.84H3.09A2.965 2.965 0 0 1 3.06 6z"
        fillRule="evenodd"
        fill="#262a30"
      ></path>
    </svg>
  );
}

// Student Chat / Peer Discussion Bubble
export function ChatIcon({ className = "w-4 h-4", ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
    >
      <path d="M2.678 11.894a1 1 0 0 1 .287.801 11 11 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8 8 0 0 0 8 14c3.996 0 7-2.807 7-6s-3.004-6-7-6-7 2.808-7 6c0 1.468.617 2.83 1.678 3.894m-.493 3.905a22 22 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a10 10 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9 9 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105" />
    </svg>
  );
}

// Saved / Bookmark Icon
export function BookmarkIcon({ className = "w-4 h-4", ...props }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.77.42L8 11.83 2.77 15.92A.5.5 0 0 1 2 15.5V2z" />
    </svg>
  );
}

// Degree / Book Icon
export function BookIcon({ className = "w-3.5 h-3.5", ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="currentColor"
      className="bi bi-book"
      viewBox="0 0 16 16"
    >
      <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783" />
    </svg>
  );
}

// Filter Adjustment Icon
export function FilterIcon({ className = "w-4 h-4", ...props }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .38.82L9.5 7.7V13.5a.5.5 0 0 1-.22.42l-3 2A.5.5 0 0 1 5.5 15.5V7.7L1.62 1.82A.5.5 0 0 1 1.5 1.5z" />
    </svg>
  );
}

// Arrow Left / Back Icon
export function ArrowLeftIcon({ className = "w-4 h-4", ...props }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg" {...props}>
      <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
    </svg>
  );
}

// External Link Icon
export function ExternalLinkIcon({ className = "w-3.5 h-3.5", ...props }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg" {...props}>
      <path fillRule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
      <path fillRule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
    </svg>
  );
}

// Calendar / Semester Start Icon
export function CalendarIcon({ className = "w-3.5 h-3.5", ...props }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
    </svg>
  );
}