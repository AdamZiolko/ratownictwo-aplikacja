import os
import json
import glob

def scale_amplitudes(directory_path):
    """
    Scales all amplitudes in JSON files in the specified directory by a factor of 0.75
    and calculates the midpoint (average of max and min amplitude) to save in the file.
    
    Args:
        directory_path: Path to the directory containing the JSON files
    """
    # Get all JSON files in the directory
    json_files = glob.glob(os.path.join(directory_path, "*.json"))
    
    print(f"Found {len(json_files)} JSON files in {directory_path}")
    
    for file_path in json_files:
        try:
            # Load the JSON data
            with open(file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
            
            # Check if the file contains a amplitudes array
            if 'amplitudes' in data and isinstance(data['amplitudes'], list):
                # Scale each amplitude by 0.75
                data['amplitudes'] = [value * 0.75 for value in data['amplitudes']]
                
                # Calculate max and min amplitude values
                max_amplitude = max(data['amplitudes'])
                min_amplitude = min(data['amplitudes'])
                
                # Calculate the midpoint (average of max and min)
                midpoint = (max_amplitude + min_amplitude) / 2
                
                # Add the midpoint to the JSON data
                data['midpoint'] = midpoint
                
                # Save the modified data back to the file
                with open(file_path, 'w', encoding='utf-8') as file:
                    json.dump(data, file, indent=2)
                
                print(f"Successfully processed {os.path.basename(file_path)} - scaled amplitudes and added midpoint: {midpoint:.2f}")
            else:
                print(f"Skipping {os.path.basename(file_path)} - no amplitudes array found")
                
        except Exception as e:
            print(f"Error processing {os.path.basename(file_path)}: {str(e)}")
    
    print("Processing complete.")

if __name__ == "__main__":
    # Path to the heart_beat_data directory
    heart_beat_data_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                                       "assets", "heart_beat_data")
    
    print(f"Processing files in: {heart_beat_data_path}")
    scale_amplitudes(heart_beat_data_path)
