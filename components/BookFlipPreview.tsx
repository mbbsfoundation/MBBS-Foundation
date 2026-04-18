"use client";

import HTMLFlipBook from "react-pageflip";

const pages = [
  "/preview/00_Poster3.png",
  "/preview/01_Cover_Front.png",
  "/preview/00_Forward.png",
  "/preview/00_ForwardCMS.png",
  "/preview/02_ToC1.png",
  "/preview/03_ToC2.png",
  "/preview/04_ToC3.png",
  "/preview/05_ToC4.png",
  "/preview/06_Chapter 1_1.png",
  "/preview/07_Chapter 1_2.png",
  "/preview/08_Chapter 1_3.png",
  "/preview/09_Chapter 1_4.png",
  "/preview/10_Chapter 31_1.png",
  "/preview/11_Chapter 31_2.png",
  "/preview/12_Chapter 31_3.png",
  "/preview/13_Chapter 31_4.png",
  "/preview/14_Chapter 31_5.png",
  "/preview/15_Chapter 31_6.png",
  "/preview/16_Chapter 61_1.png",
  "/preview/17_Chapter 61_2.png",
  "/preview/18_Chapter 61_3.png",
  "/preview/19_Tempest.png",
  "/preview/20_The hidden curriculum.png",
  "/preview/21_Cover back.png"
];

export default function BookFlipPreview() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex justify-center">
        <HTMLFlipBook
          width={350}
          height={500}
          size="stretch"
          minWidth={280}
          maxWidth={500}
          minHeight={400}
          maxHeight={700}
          maxShadowOpacity={0.5}
          showCover={false}
          mobileScrollSupport={true}
          className=""
          startPage={0}
          drawShadow={true}
          flippingTime={700}
          usePortrait={true}
          startZIndex={0}
          autoSize={true}
          clickEventForward={true}
          useMouseEvents={true}
          swipeDistance={30}
          showPageCorners={true}
          disableFlipByClick={false}
          style={{}}
        >
          {pages.map((src, index) => (
            <div
              key={index}
              className="flex h-full w-full items-center justify-center bg-white"
            >
              <img
                src={src}
                alt={`Preview page ${index + 1}`}
                className="h-full w-full object-contain"
              />
            </div>
          ))}
        </HTMLFlipBook>
      </div>

      <p className="mt-4 text-center text-sm text-slate-500">
        Flip through the preview pages to explore the book.
      </p>
      <ul className="mt-10 space-y-3 text-slate-700">
  <li>✔ Designed for new MBBS students</li>
  <li>✔ Includes CPR, First Aid, Soft Skills</li>
  <li>✔ Helps you survive and thrive in MBBS</li>
  <li>✔ Written by experienced clinician & educator</li>
</ul>
    </div>
  );
}