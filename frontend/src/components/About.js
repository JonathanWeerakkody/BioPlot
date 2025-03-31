import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      <div className="card">
        <h2>About BioPlot</h2>
        <p>
          BioPlot is a comprehensive biological visualization platform designed to create high-quality, 
          publication-ready plots for various types of biological data. This web application provides 
          an enhanced user experience with modern UI design and extensive customization options.
        </p>
        
        <h3>Features</h3>
        <ul className="features-list">
          <li>
            <strong>Comprehensive Plot Types</strong>: Support for basic plots, genome analysis, 
            transcriptome analysis, epigenome analysis, and clinical data analysis
          </li>
          <li>
            <strong>User-Friendly Interface</strong>: Clean, step-based workflow with intuitive controls
          </li>
          <li>
            <strong>Extensive Customization</strong>: Fine-grained control over all visual elements
          </li>
          <li>
            <strong>Multi-Format Export</strong>: Support for PNG, SVG, PDF, TIFF, EPS, and CSV formats
          </li>
          <li>
            <strong>Responsive Design</strong>: Works seamlessly across desktop, tablet, and mobile devices
          </li>
        </ul>
        
        <h3>Modules</h3>
        <div className="modules-section">
          <div className="module-info">
            <h4>Basic Plots</h4>
            <p>Fundamental visualization types for general data representation</p>
            <ul>
              <li>Pie Plot</li>
              <li>Bar Plot</li>
              <li>Line Plot</li>
              <li>Scatter Plot</li>
            </ul>
          </div>
          
          <div className="module-info">
            <h4>Genome Analysis</h4>
            <p>Specialized plots for genomic data visualization</p>
            <ul>
              <li>SNP Density</li>
              <li>Chromosome Distribution</li>
              <li>Peak Venn</li>
              <li>Circos Plot</li>
            </ul>
          </div>
          
          <div className="module-info">
            <h4>Transcriptome Analysis</h4>
            <p>Visualizations for gene expression and transcriptomic data</p>
            <ul>
              <li>Heatmap</li>
              <li>Volcano Plot</li>
              <li>Violin Plot</li>
              <li>Bubble Plot</li>
              <li>Chord Plot</li>
            </ul>
          </div>
          
          <div className="module-info">
            <h4>Epigenome Analysis</h4>
            <p>Plots for epigenetic data visualization</p>
            <ul>
              <li>Metagene Plot</li>
              <li>Motif Plot</li>
            </ul>
          </div>
          
          <div className="module-info">
            <h4>Clinical Data Analysis</h4>
            <p>Visualizations for clinical and biomedical research</p>
            <ul>
              <li>Forest Plot</li>
              <li>KM Plot</li>
              <li>ROC Curve</li>
            </ul>
          </div>
          
          <div className="module-info">
            <h4>Miscellaneous</h4>
            <p>Additional specialized visualization types</p>
            <ul>
              <li>Map</li>
              <li>PCA</li>
            </ul>
          </div>
        </div>
        
        <h3>Technology Stack</h3>
        <div className="tech-stack">
          <div className="tech-category">
            <h4>Frontend</h4>
            <ul>
              <li>React</li>
              <li>CSS3</li>
              <li>Responsive Design</li>
            </ul>
          </div>
          
          <div className="tech-category">
            <h4>Backend</h4>
            <ul>
              <li>Flask</li>
              <li>Python</li>
              <li>RESTful API</li>
            </ul>
          </div>
          
          <div className="tech-category">
            <h4>Visualization</h4>
            <ul>
              <li>Matplotlib</li>
              <li>Seaborn</li>
              <li>Plotly</li>
            </ul>
          </div>
        </div>
        
        <h3>Contact</h3>
        <p>
          For questions, feedback, or support, please contact us at support@bioplot.com
        </p>
      </div>
    </div>
  );
};

export default About;
