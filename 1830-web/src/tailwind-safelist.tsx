// This file exists solely to ensure Tailwind includes these classes in the build
// It's never imported or used, but Tailwind scans it during the build process

export const TailwindSafelist = () => (
  <div className="hidden">
    {/* Background colors */}
    <div className="bg-purple-500 hover:bg-purple-600" />
    <div className="bg-orange-500 hover:bg-orange-600" />
    <div className="bg-indigo-500 hover:bg-indigo-600" />
    <div className="bg-blue-500 hover:bg-blue-600" />
    <div className="bg-green-500 hover:bg-green-600" />
    <div className="bg-green-600 hover:bg-green-700" />
    <div className="bg-red-500 hover:bg-red-600" />
    <div className="bg-gray-500 hover:bg-gray-600" />
    <div className="bg-gray-300" />
    <div className="bg-yellow-500 hover:bg-yellow-600" />
    <div className="bg-emerald-500 hover:bg-emerald-600" />
    <div className="bg-teal-500 hover:bg-teal-600" />
    <div className="bg-cyan-500 hover:bg-cyan-600" />
    <div className="bg-sky-500 hover:bg-sky-600" />
    <div className="bg-violet-500 hover:bg-violet-600" />
    <div className="bg-fuchsia-500 hover:bg-fuchsia-600" />
    <div className="bg-pink-500 hover:bg-pink-600" />
    <div className="bg-rose-500 hover:bg-rose-600" />
    <div className="bg-amber-500 hover:bg-amber-600" />
    <div className="bg-lime-500 hover:bg-lime-600" />
    <div className="bg-slate-500 hover:bg-slate-600" />
    <div className="bg-zinc-500 hover:bg-zinc-600" />
    <div className="bg-neutral-500 hover:bg-neutral-600" />
    <div className="bg-stone-500 hover:bg-stone-600" />
    
    {/* Text colors */}
    <div className="text-white text-black text-gray-500 text-gray-600 text-gray-700 text-gray-800" />
    
    {/* Border colors */}
    <div className="border-gray-200 border-gray-300 hover:border-green-500" />
    
    {/* Focus states */}
    <div className="focus:ring-green-500 focus:border-green-500" />
    
    {/* Other hover states */}
    <div className="hover:text-green-600" />
  </div>
);
