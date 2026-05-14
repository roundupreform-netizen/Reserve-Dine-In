import React, { useState, useEffect } from 'react';
import { Spotlight8848 } from './8848Spotlight';
import { PulseRing8848 } from './8848PulseRing';
import { GuideArrow8848 } from './8848GuideArrow';
import { FocusBorder8848 } from './8848FocusBorder';

export const HighlightOverlay8848: React.FC = () => {
  return (
    <>
      <Spotlight8848 />
      <PulseRing8848 />
      <GuideArrow8848 />
      <FocusBorder8848 />
    </>
  );
};
