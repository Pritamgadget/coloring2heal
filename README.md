# Coloring2Heal - AI-Helped Mood Tracker Calendar

A mood tracking application that transforms your personal photos into interactive coloring book calendars. Track your daily emotions through colors and watch your monthly mood patterns emerge as beautiful artwork.

## Core Concept

Coloring2Heal allows users to upload personal photos which are automatically converted into black-and-white line art using advanced AI technology. These converted images become the background for monthly calendars where users can color individual days based on their mood. At the end of each month, the completed calendar reveals a personalized artwork that represents your emotional journey throughout that period.

## AI Technology Integration

This application is powered by **Black Forest Labs' Kontext Dev model** through the fal.ai platform, which provides state-of-the-art image-to-image transformation capabilities.

### Black Forest Kontext Dev Model

The Black Forest Labs Kontext Dev model is an advanced AI system specifically designed for intelligent image editing and style transfer. Key features include:

- **Contextual Understanding**: The model maintains the core structure and composition of your original image while applying sophisticated transformations
- **High-Quality Line Art Generation**: Converts complex photographs into clean, simplified line drawings perfect for coloring
- **Preserves Essential Details**: Maintains important visual elements while removing colors and textures
- **Optimized for Coloring Books**: Specifically tuned to create outlines suitable for manual coloring activities

### Technical Implementation

The application integrates with the Black Forest Kontext Dev model through fal.ai's API infrastructure:

- **Model Endpoint**: `fal-ai/flux-kontext/dev`
- **Processing Pipeline**: Automatic conversion of uploaded photos to coloring book format
- **Quality Settings**: Configured for optimal line art generation with 28 inference steps
- **Safety Features**: Built-in content filtering and safety checks
- **Output Optimization**: PNG format output for best coloring compatibility

## Features

### Calendar Templates

- **Minimal Template**: Clean, simple design with black borders and transparent background
- **Artistic Template**: Gradient headers with professional styling
- **Modern Template**: Dark theme with contemporary aesthetics  
- **Vintage Template**: Classic design with serif fonts and warm colors
- **Circular Template**: Innovative pie-slice layout for unique mood visualization
- **Sunflower Template**: Nature-inspired design with organic shapes

### Image Processing Workflow

1. **Upload Personal Photo**: Select any image that holds meaning for your monthly mood tracking
2. **AI Conversion**: Black Forest Kontext Dev model automatically processes your image
3. **Line Art Generation**: Advanced AI creates clean, colorable outlines while preserving essential details
4. **Calendar Integration**: Converted artwork becomes your monthly calendar background
5. **Daily Mood Coloring**: Color individual days based on your emotional state
6. **Monthly Revelation**: Complete calendar shows your mood journey as artistic expression

### Smart Features

- **API Key Management**: Secure local storage of fal.ai credentials
- **Image Caching**: Processed images stored locally for instant access
- **Real-time Preview**: See your current background image in the control panel
- **Multi-format Export**: Download calendars as PNG or PDF files
- **Batch Processing**: Generate multiple months with consistent styling
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- fal.ai API key (required for image processing)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mood-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

### API Configuration

1. Sign up for a fal.ai account at [fal.ai](https://fal.ai)
2. Generate your API key from the dashboard
3. In the application, click the "Upload & Process" button
4. Click the settings gear icon
5. Enter your fal.ai API key (stored securely in your browser)

## How It Works

### The AI Processing Pipeline

When you upload an image, the application sends it to the Black Forest Kontext Dev model with a carefully crafted prompt:

*"Turn this photo into a clean black-and-white line art illustration, suitable for a colouring book. Simplify the background and objects, keep only essential outlines, and remove all colours and textures."*

The AI model processes this request using advanced computer vision and generative techniques to:

1. **Analyze Image Content**: Understand the structure and important elements
2. **Edge Detection**: Identify significant boundaries and shapes
3. **Simplification**: Remove unnecessary details while preserving character
4. **Line Art Creation**: Generate clean, continuous outlines
5. **Optimization**: Ensure the result is perfect for manual coloring

### Mood Tracking Method

- Select different colors to represent various emotions
- Color individual calendar days based on your daily mood
- Watch patterns emerge as you progress through the month
- Use the completed calendar as both art and emotional insight

### Privacy and Security

- All image processing happens through encrypted API calls
- API keys stored locally in your browser only
- No personal images stored on external servers beyond processing time
- Processed results cached locally for your privacy

## Technical Architecture

### Built With

- **Next.js 14**: React framework for production-ready applications
- **TypeScript**: Type-safe development environment
- **Tailwind CSS**: Utility-first styling framework
- **fal.ai Client**: Official SDK for Black Forest Labs integration
- **Date-fns**: Modern date manipulation library

### AI Model Integration

The application leverages the Black Forest Kontext Dev model's capabilities through a robust integration:

```typescript
import { fal } from '@fal-ai/client'

const result = await fal.subscribe('fal-ai/flux-kontext/dev', {
  input: {
    image_url: uploadedImage,
    prompt: lineArtConversionPrompt,
    num_inference_steps: 28,
    guidance_scale: 2.5,
    output_format: "png",
    resolution_mode: "auto"
  }
})
```

## Contributing

We welcome contributions that enhance the mood tracking experience or improve the AI integration. Please ensure any changes maintain the quality and reliability of the Black Forest Kontext Dev model integration.

## License

This project is licensed under the MIT License. The Black Forest Kontext Dev model is provided by Black Forest Labs through fal.ai and subject to their respective terms of service.

## Acknowledgments

Special thanks to **Black Forest Labs** for developing the Kontext Dev model, which makes the core functionality of this application possible. The advanced AI capabilities provided by this model enable users to transform personal photographs into meaningful, interactive mood tracking tools.

## Support

For issues related to:
- **Application Features**: Open an issue in this repository
- **AI Model Performance**: Refer to fal.ai documentation and Black Forest Labs resources
- **API Integration**: Check fal.ai support channels

---

Transform your photos into powerful mood tracking tools with the advanced AI capabilities of Black Forest Labs' Kontext Dev model. Start your emotional wellness journey today.