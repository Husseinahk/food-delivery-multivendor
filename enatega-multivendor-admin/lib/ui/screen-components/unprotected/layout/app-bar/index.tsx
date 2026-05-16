/* eslint-disable @next/next/no-img-element */

'use client';

// Core
import Link from 'next/link';

// Styles
import classes from './app-bar.module.css';

// Orda white-label: pre-auth there is no restaurant context yet, so the
// login header shows a neutral German product label instead of the
// Enatega logo. (The in-app topbar shows the restaurant's own name.)
const AppTopbar = () => {
  return (
    <div className={`${classes['layout-topbar']} dark:bg-dark-900`}>
      <div>
        <div className="flex flex-row items-center gap-6">
          <Link
            href="/"
            className="layout-topbar-log text-xl font-bold tracking-tight"
          >
            Restaurant-Verwaltung
          </Link>
        </div>
      </div>
    </div>
  );
};

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
