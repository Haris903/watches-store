import React from 'react'

const page = () => {
  return (
 <>
    <div className="w-full min-h-screen text-white flex relative overflow-hidden">
      <div className="flex bg-black px-16 h-12 w-full justify-center space-x-50 ">
        {/* less than */}
        <div className="arrow py-[15px]"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="#dbdbdb" fill="none" stroke="#dbdbdb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 4L8.66943 10.0405C6.44352 11.6545 6.44353 12.3455 8.66943 13.9595L17 20"></path>
</svg></div>

        <div className="content font-Inter py-3 text-[15px]">UPTO 30% OFF | SALE IS NOW LIVE</div>
         <div className="hidden font-Inter py-3 text-[15px]">✓ Free Nationwide Shipping | 7-Day Easy Returns | 1 Year Warranty</div>

        {/* greater than */}
        <div className="arrow py-[15px]"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="#dbdbdb" fill="none" stroke="#dbdbdb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 4L15.3306 10.0405C17.5565 11.6545 17.5565 12.3455 15.3306 13.9595L7 20"></path>
</svg></div>
      </div>
    </div>
    </>
  )
}

export default page